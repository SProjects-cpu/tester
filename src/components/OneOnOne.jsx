import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle, XCircle, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupGridCard from './StartupGridCard';
import StartupDetailModal from './StartupDetailModal';
import ViewToggle from './ViewToggle';
import GuestRestrictedButton from './GuestRestrictedButton';
import RejectionModal from './RejectionModal';

export default function OneOnOne({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showSessionForm, setShowSessionForm] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(null);

  const handleExport = (format) => {
    exportStartupsComprehensive(filteredStartups, format, 'OneOnOne-Startups');
    alert(`One-on-One startups exported as ${format.toUpperCase()}!`);
  };
  const [sessionData, setSessionData] = useState({
    date: '',
    time: '',
    mentorName: '',
    feedback: '',
    progress: ''
  });

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm]);

  const loadStartups = () => {
    const data = storage.get('startups', []).filter(
      s => s.stage === 'One-on-One' && s.status === 'Active'
    );
    setStartups(data);
  };

  const filterStartups = () => {
    let filtered = startups;
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.founderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sector?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStartups(filtered);
  };

  const handleAddSession = (startup) => {
    setShowSessionForm(startup);
    setSessionData({ date: '', time: '', mentorName: '', feedback: '', progress: '' });
  };

  const submitSession = () => {
    if (!sessionData.date || !sessionData.time || !sessionData.mentorName || !sessionData.feedback) {
      alert('Please fill all required fields');
      return;
    }

    const startup = showSessionForm;
    const oneOnOneHistory = startup.oneOnOneHistory || [];
    oneOnOneHistory.push(sessionData);

    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s =>
      s.id === startup.id ? { ...s, oneOnOneHistory } : s
    );
    storage.set('startups', updated);

    setShowSessionForm(null);
    loadStartups();
    alert('Session added successfully!');
  };

  const handleOnboard = (startup) => {
    if (confirm('Are you sure you want to onboard this startup?')) {
      const allStartups = storage.get('startups', []);
      const updated = allStartups.map(s =>
        s.id === startup.id ? { ...s, status: 'Onboarded', onboardedDate: new Date().toISOString() } : s
      );
      storage.set('startups', updated);
      loadStartups();
    }
  };

  const handleReject = (startup, rejectionRemark) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s =>
      s.id === startup.id ? { 
        ...s, 
        status: 'Rejected',
        rejectionRemark,
        rejectedDate: new Date().toISOString(),
        rejectedFromStage: s.stage
      } : s
    );
    storage.set('startups', updated);
    setShowRejectionModal(null);
    loadStartups();
  };

  const handleUpdateStartup = (updatedStartup) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => s.id === updatedStartup.id ? updatedStartup : s);
    storage.set('startups', updated);
    loadStartups();
  };

  // Dynamic grid columns based on number of startups
  const getGridColumns = () => {
    const count = filteredStartups.length;
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    if (count <= 12) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            One-on-One Mentorship
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} in one-on-one mentorship
          </p>
        </div>
        <ExportMenu 
          onExport={handleExport}
          title="Export"
          formats={['pdf', 'json', 'csv', 'excel']}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, founder, or sector..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={`grid ${getGridColumns()} gap-3 sm:gap-4`}>
          <AnimatePresence>
            {filteredStartups.map(startup => (
              <StartupGridCard
                key={startup.id}
                startup={startup}
                onUpdate={handleUpdateStartup}
                onDelete={() => {}}
                onClick={() => setSelectedStartup(startup)}
                isGuest={isGuest}
                isCompact={filteredStartups.length > 8}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <AnimatePresence>
            {filteredStartups.map(startup => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{startup.companyName}</h3>
                  <p className="text-white/90">Founder: {startup.founderName}</p>
                  <p className="text-white/80 text-sm">{startup.city} • {startup.sector}</p>
                </div>

                <div className="p-6 space-y-4">
                  {startup.oneOnOneHistory && startup.oneOnOneHistory.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Session History
                      </h4>
                      {startup.oneOnOneHistory.map((session, index) => (
                        <div key={index} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Date:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{session.date}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Time:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">{session.time}</span>
                            </div>
                          </div>
                          <div className="text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Mentor:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{session.mentorName}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Feedback:</span>
                            <p className="mt-1 text-gray-900 dark:text-white">{session.feedback}</p>
                          </div>
                          {session.progress && (
                            <div className="text-sm mt-2">
                              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                              <p className="mt-1 text-gray-900 dark:text-white">{session.progress}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => handleAddSession(startup)}
                      actionType="feedback"
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Session</span>
                    </GuestRestrictedButton>
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => handleOnboard(startup)}
                      actionType="onboard"
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Onboard</span>
                    </GuestRestrictedButton>
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => setShowRejectionModal(startup)}
                      actionType="reject"
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Reject</span>
                    </GuestRestrictedButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredStartups.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl"
        >
          <p className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">
            No startups in one-on-one mentorship yet
          </p>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedStartup && (
          <StartupDetailModal
            startup={selectedStartup}
            onClose={() => setSelectedStartup(null)}
            onUpdate={handleUpdateStartup}
            isGuest={isGuest}
          />
        )}
        {showRejectionModal && (
          <RejectionModal
            startup={showRejectionModal}
            onClose={() => setShowRejectionModal(null)}
            onConfirm={(remark) => handleReject(showRejectionModal, remark)}
          />
        )}
        {showSessionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSessionForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Add One-on-One Session
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={sessionData.time}
                    onChange={(e) => setSessionData({ ...sessionData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mentor Name *
                  </label>
                  <input
                    type="text"
                    value={sessionData.mentorName}
                    onChange={(e) => setSessionData({ ...sessionData, mentorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter mentor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feedback *
                  </label>
                  <textarea
                    value={sessionData.feedback}
                    onChange={(e) => setSessionData({ ...sessionData, feedback: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter feedback..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Progress Notes
                  </label>
                  <textarea
                    value={sessionData.progress}
                    onChange={(e) => setSessionData({ ...sessionData, progress: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Optional progress notes..."
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSessionForm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={submitSession}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Add Session
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
