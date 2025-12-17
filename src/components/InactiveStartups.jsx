import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Mail, Phone, Calendar, TrendingDown, RefreshCw, Download, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';

export default function InactiveStartups() {
  const [inactiveStartups, setInactiveStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, s0, s1, s2, s3, oneOnOne

  const handleExport = (format) => {
    exportStartupsComprehensive(filteredStartups, format, 'Inactive-Startups');
    alert(`Inactive startups exported as ${format.toUpperCase()}!`);
  };

  useEffect(() => {
    checkInactiveStartups();
  }, []);

  const checkInactiveStartups = () => {
    setLoading(true);
    const startups = storage.get('startups', []);
    const smcSchedules = storage.get('smcSchedules', []);
    const oneOnOneSchedules = storage.get('oneOnOneSchedules', []);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const inactive = startups.filter(startup => {
      // Only check for S0, S1, S2, S3, and One-on-One stages
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
    setLoading(false);
  };

  const getStageColor = (stage) => {
    const colors = {
      'S0': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300',
      'S1': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300',
      'S2': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300',
      'S3': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300',
      'One-on-One': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const filteredStartups = filter === 'all' 
    ? inactiveStartups 
    : inactiveStartups.filter(s => {
        if (filter === 'oneOnOne') return s.stage === 'One-on-One';
        return s.stage === filter.toUpperCase();
      });

  const stats = {
    total: inactiveStartups.length,
    s0: inactiveStartups.filter(s => s.stage === 'S0').length,
    s1: inactiveStartups.filter(s => s.stage === 'S1').length,
    s2: inactiveStartups.filter(s => s.stage === 'S2').length,
    s3: inactiveStartups.filter(s => s.stage === 'S3').length,
    oneOnOne: inactiveStartups.filter(s => s.stage === 'One-on-One').length
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Inactive Startups
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Startups with no activity for more than 30 days
            </p>
          </div>
          <div className="flex gap-3">
            <ExportMenu 
              onExport={handleExport}
              title="Export"
              formats={['pdf', 'json', 'csv', 'excel']}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={checkInactiveStartups}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, filter: 'all', color: 'from-orange-500 to-red-500' },
          { label: 'S0', value: stats.s0, filter: 's0', color: 'from-gray-500 to-gray-600' },
          { label: 'S1', value: stats.s1, filter: 's1', color: 'from-blue-500 to-blue-600' },
          { label: 'S2', value: stats.s2, filter: 's2', color: 'from-purple-500 to-purple-600' },
          { label: 'S3', value: stats.s3, filter: 's3', color: 'from-orange-500 to-orange-600' },
          { label: '1-on-1', value: stats.oneOnOne, filter: 'oneOnOne', color: 'from-indigo-500 to-indigo-600' }
        ].map((stat, index) => (
          <motion.div
            key={stat.filter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => setFilter(stat.filter)}
            className={`cursor-pointer p-4 rounded-xl shadow-lg transition-all ${
              filter === stat.filter 
                ? `bg-gradient-to-r ${stat.color} text-white` 
                : 'bg-white dark:bg-gray-800 hover:shadow-xl'
            }`}
          >
            <div className={`text-2xl font-bold ${filter === stat.filter ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {stat.value}
            </div>
            <div className={`text-sm ${filter === stat.filter ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading inactive startups...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStartups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700"
        >
          <TrendingDown className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
            Great News!
          </h3>
          <p className="text-green-600 dark:text-green-400">
            {filter === 'all' 
              ? 'No inactive startups found. All startups are active!' 
              : `No inactive startups in ${filter.toUpperCase()} stage.`}
          </p>
        </motion.div>
      )}

      {/* Startups List */}
      {!loading && filteredStartups.length > 0 && (
        <div className="space-y-4">
          {filteredStartups.map((startup, index) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {startup.companyName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStageColor(startup.stage)}`}>
                            {startup.stage}
                          </span>
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                            {startup.daysSinceActivity} days inactive
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Founder:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.founderName}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">City:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.city}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Sector:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.sector}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Last Activity:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.lastActivityType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Date:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.lastActivityDate}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">MAGIC Code:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.magicCode}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Contact */}
                  <div className="flex flex-col space-y-2 sm:min-w-[200px]">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs">Email</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white text-xs truncate">
                        {startup.founderEmail || startup.email}
                      </p>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="text-xs">Phone</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white text-xs">
                        {startup.founderMobile || startup.mobile}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 pt-2">
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={`mailto:${startup.founderEmail || startup.email}`}
                        className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send Email</span>
                      </motion.a>
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={`tel:${startup.founderMobile || startup.mobile}`}
                        className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call Now</span>
                      </motion.a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
