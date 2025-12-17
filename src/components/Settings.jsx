import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Download, Upload, Trash2, Bell, Check, X, FileJson, FileSpreadsheet, FileText, ChevronDown, Award, TrendingUp, BarChart3, Lock, Key } from 'lucide-react';
import { api } from '../utils/api';
import { 
  storage, 
  exportData, 
  exportStartupsJSON,
  exportStartupsCSV,
  exportSMCSchedules,
  exportOneOnOneSessions,
  exportByStatus,
  exportByStatusCSV,
  exportByStage,
  exportSummaryReport,
  exportAchievementsReport,
  exportRevenueReport,
  exportProgressReport,
  importData 
} from '../utils/storage';
import { 
  exportSMCSchedulesToPDF, 
  exportOneOnOneSessionsToPDF,
  exportAchievementsToPDF,
  exportRevenueToPDF,
  exportStartupsComprehensive
} from '../utils/exportUtils';
import GuestManagement from './GuestManagement';
import AdminAuthModal from './AdminAuthModal';
import AdminCredentialsModal from './AdminCredentialsModal';

export default function Settings({ darkMode, toggleDarkMode, isGuest = false }) {
  const [accessRequests, setAccessRequests] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!isGuest) {
      const requests = storage.get('accessRequests', []);
      setAccessRequests(requests.filter(r => r.status === 'pending'));
      fetchDatabaseStats();
      fetchCurrentUser();
    }
  }, [isGuest]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Check if token exists and is valid format
      if (!token || token.split('.').length !== 3) {
        console.warn('Invalid or missing token, skipping user fetch');
        return;
      }
      
      const data = await api.getCurrentUser();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
      // Token might be expired, api client will handle it
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Check if token exists and is valid format
      if (!token || token.split('.').length !== 3) {
        console.warn('Invalid or missing token, skipping stats fetch');
        return;
      }
      
      // Use Next.js API route instead of Express
      const response = await fetch('/api/startups/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Map the stats data to match expected format
        setDbStats({
          startups: data.total || 0,
          users: 1, // We have at least admin user
          meetings: 0,
          achievements: 0
        });
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      // Token might be expired, api client will handle it
    }
  };

  const handleAutoMigration = async () => {
    setAuthModal({
      isOpen: true,
      title: 'Migrate to Database',
      message: 'This will migrate all your localStorage data to PostgreSQL database. Please authenticate to proceed.',
      actionType: 'info',
      onConfirm: async () => {
        setMigrating(true);
        setMigrationResult(null);
        await performMigration();
      }
    });
  };

  const performMigration = async () => {

    try {
      // Gather all localStorage data
      const localData = {
        startups: storage.get('startups', []),
        smcSchedules: storage.get('smcSchedules', []),
        oneOnOneSchedules: storage.get('oneOnOneSchedules', []),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // Migration is no longer needed as we're using PostgreSQL directly
      alert('⚠️ Migration feature is deprecated.\n\nThe system now uses PostgreSQL database directly.\nAll data is already in the database.');
      return;

      const result = await response.json();

      if (result.success) {
        setMigrationResult({
          success: true,
          message: 'Migration completed successfully!',
          stats: result.stats
        });
        // Refresh database stats
        fetchDatabaseStats();
        alert(`✅ Migration Successful!\n\n` +
          `✓ Startups created: ${result.stats.startupsCreated}\n` +
          `✓ Startups updated: ${result.stats.startupsUpdated}\n` +
          `✓ Achievements: ${result.stats.achievementsMigrated}\n` +
          `✓ Progress records: ${result.stats.progressRecordsMigrated}\n` +
          `✓ SMC meetings: ${result.stats.smcMeetingsMigrated}\n` +
          `✓ One-on-One meetings: ${result.stats.oneOnOneMeetingsMigrated}\n\n` +
          `Open Prisma Studio to view your data!`
        );
      } else {
        setMigrationResult({
          success: false,
          message: result.message || 'Migration failed'
        });
        alert('❌ Migration failed: ' + result.message);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        message: error.message
      });
      alert('❌ Migration error: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleApproveRequest = (requestId) => {
    const requests = storage.get('accessRequests', []);
    const updatedRequests = requests.map(r => 
      r.id === requestId ? { ...r, status: 'approved' } : r
    );
    storage.set('accessRequests', updatedRequests);
    setAccessRequests(updatedRequests.filter(r => r.status === 'pending'));
    alert('Request approved! Guest user has been notified.');
  };

  const handleDenyRequest = (requestId) => {
    const requests = storage.get('accessRequests', []);
    const updatedRequests = requests.map(r => 
      r.id === requestId ? { ...r, status: 'denied' } : r
    );
    storage.set('accessRequests', updatedRequests);
    setAccessRequests(updatedRequests.filter(r => r.status === 'pending'));
  };

  const handleExport = (type) => {
    setAuthModal({
      isOpen: true,
      title: 'Export Data',
      message: 'You are about to export sensitive startup data. Please authenticate to proceed.',
      actionType: 'warning',
      onConfirm: () => performExport(type)
    });
  };

  const performExport = (type) => {
    switch(type) {
      case 'all':
        exportData();
        alert('Full data exported successfully!');
        break;
      case 'startups-json':
        exportStartupsJSON();
        alert('Startups exported as JSON!');
        break;
      case 'startups-csv':
        exportStartupsCSV();
        alert('Startups exported as CSV!');
        break;
      case 'smc':
        exportSMCSchedules();
        alert('SMC schedules exported as JSON!');
        break;
      case 'smc-pdf':
        exportSMCSchedulesToPDF();
        alert('SMC schedules exported as PDF!');
        break;
      case 'oneOnOne':
        exportOneOnOneSessions();
        alert('One-on-One sessions exported as JSON!');
        break;
      case 'oneOnOne-pdf':
        exportOneOnOneSessionsToPDF();
        alert('One-on-One sessions exported as PDF!');
        break;
      case 'active':
        exportByStatus('Active');
        alert('Active startups exported!');
        break;
      case 'active-csv':
        exportByStatusCSV('Active');
        alert('Active startups exported as CSV!');
        break;
      case 'onboarded':
        exportByStatus('Onboarded');
        alert('Onboarded startups exported!');
        break;
      case 'onboarded-csv':
        exportByStatusCSV('Onboarded');
        alert('Onboarded startups exported as CSV!');
        break;
      case 'graduated':
        exportByStatus('Graduated');
        alert('Graduated startups exported!');
        break;
      case 'graduated-csv':
        exportByStatusCSV('Graduated');
        alert('Graduated startups exported as CSV!');
        break;
      case 'achievements':
        exportAchievementsReport();
        alert('Achievements report exported as JSON!');
        break;
      case 'achievements-pdf':
        exportAchievementsToPDF();
        alert('Achievements report exported as PDF!');
        break;
      case 'revenue':
        exportRevenueReport();
        alert('Revenue report exported as JSON!');
        break;
      case 'revenue-pdf':
        exportRevenueToPDF();
        alert('Revenue report exported as PDF!');
        break;
      case 'progress':
        exportProgressReport();
        alert('Progress tracking report exported!');
        break;
      case 'summary':
        exportSummaryReport();
        alert('Summary report exported!');
        break;
      default:
        exportData();
    }
    setShowExportMenu(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAuthModal({
        isOpen: true,
        title: 'Import Data',
        message: 'You are about to import data which will modify your database. Please authenticate to proceed.',
        actionType: 'warning',
        onConfirm: () => {
          importData(file, (success) => {
            if (success) {
              alert('Data imported successfully! Please refresh the page.');
              window.location.reload();
            } else {
              alert('Failed to import data. Please check the file format.');
            }
          });
        }
      });
    }
  };

  const handleClearData = () => {
    setAuthModal({
      isOpen: true,
      title: 'Clear All Data',
      message: 'This will permanently delete ALL startups, schedules, and sessions. This action cannot be undone. Please authenticate to proceed.',
      actionType: 'danger',
      onConfirm: () => {
        storage.set('startups', []);
        storage.set('smcSchedules', []);
        storage.set('oneOnOneSessions', []);
        alert('All data cleared successfully!');
        window.location.reload();
      }
    });
  };

  const closeAuthModal = () => {
    setAuthModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      actionType: 'warning'
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your preferences and data
        </p>
      </div>

      <div className="space-y-6">
        {/* Access Requests - Admin Only */}
        {!isGuest && accessRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Access Requests ({accessRequests.length})
              </h2>
            </div>
            <div className="space-y-3">
              {accessRequests.map((request) => (
                <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {request.username}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Requesting access to: <span className="font-medium">{request.actionType}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleApproveRequest(request.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDenyRequest(request.id)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Deny"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Guest Management - Admin Only */}
        {!isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <GuestManagement />
          </motion.div>
        )}

        {/* Dark Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {darkMode ? <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Sun className="w-6 h-6 text-gray-700" />}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`px-6 py-3 rounded-xl font-semibold shadow-md transition-all ${
                darkMode
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
              }`}
            >
              Toggle
            </motion.button>
          </div>
        </motion.div>

        {/* Database Management - Admin Only */}
        {!isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-700"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span>Database Management</span>
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Prisma Studio
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        View and manage PostgreSQL database
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open('http://localhost:5555', '_blank')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Open Studio
                  </motion.button>
                </div>
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 <strong>Tip:</strong> Make sure Prisma Studio is running. Open terminal and run: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">npm run prisma:studio</code>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Auto-Migrate to Database
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        One-click migration from localStorage to PostgreSQL
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAutoMigration}
                    disabled={migrating}
                    className={`px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all ${
                      migrating
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                    }`}
                  >
                    {migrating ? 'Migrating...' : 'Migrate Now'}
                  </motion.button>
                </div>
                
                {dbStats && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">
                      📊 Current Database Stats:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-green-700 dark:text-green-400">{dbStats.startups}</p>
                        <p className="text-gray-600 dark:text-gray-400">Startups</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700 dark:text-green-400">{dbStats.achievements}</p>
                        <p className="text-gray-600 dark:text-gray-400">Achievements</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700 dark:text-green-400">{dbStats.progressRecords}</p>
                        <p className="text-gray-600 dark:text-gray-400">Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700 dark:text-green-400">{dbStats.smcMeetings}</p>
                        <p className="text-gray-600 dark:text-gray-400">SMC</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-700 dark:text-green-400">{dbStats.oneOnOneMeetings}</p>
                        <p className="text-gray-600 dark:text-gray-400">1-on-1</p>
                      </div>
                    </div>
                  </div>
                )}

                {migrationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-lg ${
                      migrationResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${
                      migrationResult.success
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-red-800 dark:text-red-300'
                    }`}>
                      {migrationResult.success ? '✅' : '❌'} {migrationResult.message}
                    </p>
                    {migrationResult.stats && (
                      <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        <p>• Startups created: {migrationResult.stats.startupsCreated}</p>
                        <p>• Startups updated: {migrationResult.stats.startupsUpdated}</p>
                        <p>• Achievements: {migrationResult.stats.achievementsMigrated}</p>
                        <p>• Progress records: {migrationResult.stats.progressRecordsMigrated}</p>
                        <p>• SMC meetings: {migrationResult.stats.smcMeetingsMigrated}</p>
                        <p>• One-on-One meetings: {migrationResult.stats.oneOnOneMeetingsMigrated}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 <strong>How it works:</strong> Click "Migrate Now" to automatically transfer all your localStorage data (startups, achievements, meetings) to PostgreSQL. The migration is smart - it won't create duplicates!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Export Data
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Download data in various formats
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>Export Options</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3"
                  >
                    {/* Full Export */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('all')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Full Export (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All data including settings</p>
                      </div>
                    </motion.button>

                    {/* Startups JSON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('startups-json')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileJson className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Startups (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All startups data</p>
                      </div>
                    </motion.button>

                    {/* Startups CSV */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('startups-csv')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Startups (CSV)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Excel-compatible format</p>
                      </div>
                    </motion.button>

                    {/* SMC Schedules JSON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('smc')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileJson className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">SMC Schedules (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All SMC meetings</p>
                      </div>
                    </motion.button>

                    {/* SMC Schedules PDF */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('smc-pdf')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">SMC Schedules (PDF)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Formatted report</p>
                      </div>
                    </motion.button>

                    {/* One-on-One Sessions JSON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('oneOnOne')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileJson className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">One-on-One (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All mentorship sessions</p>
                      </div>
                    </motion.button>

                    {/* One-on-One Sessions PDF */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('oneOnOne-pdf')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">One-on-One (PDF)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Formatted report</p>
                      </div>
                    </motion.button>

                    {/* Active Startups */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('active')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Active Startups</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Currently active only</p>
                      </div>
                    </motion.button>

                    {/* Onboarded Startups */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('onboarded')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Onboarded Startups</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Onboarded only</p>
                      </div>
                    </motion.button>

                    {/* Graduated Startups */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('graduated')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Graduated Startups</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Graduated only</p>
                      </div>
                    </motion.button>

                    {/* Active CSV */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('active-csv')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Active (CSV)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Excel format</p>
                      </div>
                    </motion.button>

                    {/* Onboarded CSV */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('onboarded-csv')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Onboarded (CSV)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Excel format</p>
                      </div>
                    </motion.button>

                    {/* Graduated CSV */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('graduated-csv')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileSpreadsheet className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Graduated (CSV)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Excel format</p>
                      </div>
                    </motion.button>

                    {/* Achievements Report JSON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('achievements')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Achievements (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All achievements data</p>
                      </div>
                    </motion.button>

                    {/* Achievements Report PDF */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('achievements-pdf')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Achievements (PDF)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Formatted report</p>
                      </div>
                    </motion.button>

                    {/* Revenue Report JSON */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('revenue')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Revenue (JSON)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">All revenue entries</p>
                      </div>
                    </motion.button>

                    {/* Revenue Report PDF */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('revenue-pdf')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Revenue (PDF)</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Formatted report</p>
                      </div>
                    </motion.button>

                    {/* Progress Report */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('progress')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left"
                    >
                      <BarChart3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Progress Report</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Tracking data</p>
                      </div>
                    </motion.button>

                    {/* Summary Report */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleExport('summary')}
                      className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg hover:shadow-md transition-all text-left md:col-span-2"
                    >
                      <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">Summary Report</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Statistics and overview</p>
                      </div>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Import Data
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload JSON file to restore data
                  </p>
                </div>
              </div>
              <label className="cursor-pointer">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Import
                </motion.div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Clear All Data
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Delete all startups and schedules
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearData}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Clear
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Admin Credentials Management */}
        {!isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500 rounded-xl">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Admin Credentials
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Update your admin email and password
                  </p>
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCredentialsModal(true)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>Update Credentials</span>
            </motion.button>
          </motion.div>
        )}

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            System Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Version:</span>
              <span className="text-gray-900 dark:text-white font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Organization:</span>
              <span className="text-gray-900 dark:text-white font-medium">CMIA Marathwada Industries</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Location:</span>
              <span className="text-gray-900 dark:text-white font-medium">Aurangabad</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Storage:</span>
              <span className="text-gray-900 dark:text-white font-medium">LocalStorage</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        <AdminAuthModal
          isOpen={authModal.isOpen}
          onClose={closeAuthModal}
          onConfirm={authModal.onConfirm}
          title={authModal.title}
          message={authModal.message}
          actionType={authModal.actionType}
        />
      </AnimatePresence>

      {/* Admin Credentials Modal */}
      <AnimatePresence>
        {showCredentialsModal && (
          <AdminCredentialsModal
            isOpen={showCredentialsModal}
            onClose={() => setShowCredentialsModal(false)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
