import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock, Mail, Phone } from 'lucide-react';
import { storage } from '../utils/storage';

export default function InactiveStartupNotifications({ onNavigate }) {
  const [inactiveStartups, setInactiveStartups] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    checkInactiveStartups();
    // Check every hour
    const interval = setInterval(checkInactiveStartups, 3600000);
    return () => clearInterval(interval);
  }, []);

  const checkInactiveStartups = () => {
    const startups = storage.get('startups', []);
    const smcSchedules = storage.get('smcSchedules', []);
    const oneOnOneSchedules = storage.get('oneOnOneSchedules', []);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const inactive = startups.filter(startup => {
      // Only check for S0, S1, S2, S3, and One-on-One stages
      // Skip Onboarded and Graduated startups
      const eligibleStages = ['S0', 'S1', 'S2', 'S3', 'One-on-One'];
      if (!eligibleStages.includes(startup.stage) || 
          startup.status === 'Onboarded' || 
          startup.status === 'Graduated' ||
          startup.status === 'Rejected') {
        return false;
      }

      // Get the last activity date
      let lastActivityDate = null;
      let lastActivityType = 'Registration';

      // Check for last completed SMC meeting
      const startupSMCSchedules = smcSchedules
        .filter(s => s.startupId === startup.id && s.status === 'Completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (startupSMCSchedules.length > 0) {
        lastActivityDate = new Date(startupSMCSchedules[0].date);
        lastActivityType = 'SMC Meeting';
      }

      // Check for last completed One-on-One meeting
      const startupOneOnOneSchedules = oneOnOneSchedules
        .filter(s => s.startupId === startup.id && s.status === 'Completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (startupOneOnOneSchedules.length > 0) {
        const oneOnOneDate = new Date(startupOneOnOneSchedules[0].date);
        if (!lastActivityDate || oneOnOneDate > lastActivityDate) {
          lastActivityDate = oneOnOneDate;
          lastActivityType = 'One-on-One Meeting';
        }
      }

      // Check pitch history
      if (startup.pitchHistory && startup.pitchHistory.length > 0) {
        const lastPitch = startup.pitchHistory[startup.pitchHistory.length - 1];
        if (lastPitch.date) {
          const pitchDate = new Date(lastPitch.date);
          if (!lastActivityDate || pitchDate > lastActivityDate) {
            lastActivityDate = pitchDate;
            lastActivityType = 'Pitch Session';
          }
        }
      }

      // Check one-on-one history
      if (startup.oneOnOneHistory && startup.oneOnOneHistory.length > 0) {
        const lastSession = startup.oneOnOneHistory[startup.oneOnOneHistory.length - 1];
        if (lastSession.completedAt) {
          const sessionDate = new Date(lastSession.completedAt);
          if (!lastActivityDate || sessionDate > lastActivityDate) {
            lastActivityDate = sessionDate;
            lastActivityType = 'Mentorship Session';
          }
        }
      }

      // If no activity found, use registration date
      if (!lastActivityDate) {
        if (startup.createdAt) {
          lastActivityDate = new Date(startup.createdAt);
        } else if (startup.registeredDate) {
          lastActivityDate = new Date(startup.registeredDate);
        }
      }

      // Check if inactive for more than 30 days
      if (!lastActivityDate || lastActivityDate < thirtyDaysAgo) {
        const daysSinceActivity = lastActivityDate 
          ? Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24))
          : null;
        
        return {
          ...startup,
          daysSinceActivity: daysSinceActivity || 'Unknown',
          lastActivityDate: lastActivityDate ? lastActivityDate.toLocaleDateString() : 'Unknown',
          lastActivityType
        };
      }
      return false;
    }).filter(Boolean);

    setInactiveStartups(inactive);
  };

  const handleDismiss = (startupId) => {
    setDismissed([...dismissed, startupId]);
  };

  const visibleInactive = inactiveStartups.filter(s => !dismissed.includes(s.id));

  if (visibleInactive.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2 bg-orange-500 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200">
              Inactive Startups Alert
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {visibleInactive.length} startup{visibleInactive.length !== 1 ? 's have' : ' has'} been inactive for more than 30 days
            </p>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {visibleInactive.map((startup) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {startup.companyName}
                      </h4>
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-semibold">
                        {startup.stage}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>
                          Inactive: {startup.daysSinceActivity} days
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <span>Last: {startup.lastActivityType}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <span>Date: {startup.lastActivityDate}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{startup.founderEmail || startup.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{startup.founderMobile || startup.mobile}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => window.location.href = `mailto:${startup.founderEmail || startup.email}`}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Send Email
                      </button>
                      <button
                        onClick={() => window.location.href = `tel:${startup.founderMobile || startup.mobile}`}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                      >
                        Call
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDismiss(startup.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2"
                    title="Dismiss"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => onNavigate && onNavigate('inactive')}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
          >
            View All Inactive Startups
          </button>
          {visibleInactive.length > 3 && (
            <button
              onClick={() => setDismissed(inactiveStartups.map(s => s.id))}
              className="px-4 py-2 text-sm text-orange-700 dark:text-orange-300 hover:underline font-semibold"
            >
              Dismiss All
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
