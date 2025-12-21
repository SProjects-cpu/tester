import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Download, Upload, Trash2, Bell, Check, X, FileJson, FileSpreadsheet, FileText, ChevronDown, Award, TrendingUp, BarChart3, Lock, Key } from 'lucide-react';
import { api, startupApi } from '../utils/api';
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
  exportProgressReport
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
import ImportStartups from './ImportStartups';

export default function Settings({ darkMode, toggleDarkMode, isGuest = false }) {
  const [accessRequests, setAccessRequests] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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

  const handleImportStartups = (importedStartups) => {
    setAuthModal({
      isOpen: true,
      title: 'Import Startups',
      message: `You are about to import ${importedStartups.length} startup(s). Please authenticate to proceed with this operation.`,
      actionType: 'warning',
      onConfirm: async () => {
        try {
          const results = await startupApi.bulkCreate(importedStartups);
          setShowImportModal(false);
          alert(`✅ Successfully imported ${results.results.length} startup(s)!${results.errors.length > 0 ? `\n⚠️ ${results.errors.length} failed.` : ''}`);
          window.location.reload();
        } catch (error) {
          console.error('Error importing startups:', error);
          alert('❌ Failed to import startups: ' + error.message);
        }
      }
    });
  };

  const handleClearData = () => {
    setAuthModal({
      isOpen: true,
      title: 'Clear All Data',
      message: 'This will permanently delete ALL startups, schedules, and sessions from the database. This action cannot be undone. Please authenticate to proceed.',
      actionType: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch(`/api/admin/clear-all-data`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (response.ok) {
            // Also clear localStorage for consistency
            storage.set('startups', []);
            storage.set('smcSchedules', []);
            storage.set('oneOnOneSessions', []);
            
            alert(`✅ All data cleared successfully!\n\n` +
              `Deleted from database:\n` +
              `• Startups: ${data.deleted?.startups || 0}\n` +
              `• Achievements: ${data.deleted?.achievements || 0}\n` +
              `• Progress History: ${data.deleted?.progressHistory || 0}\n` +
              `• One-on-One Meetings: ${data.deleted?.oneOnOneMeetings || 0}\n` +
              `• SMC Meetings: ${data.deleted?.smcMeetings || 0}\n` +
              `• Agreements: ${data.deleted?.agreements || 0}`
            );
            window.location.reload();
          } else {
            alert('❌ Failed to clear data: ' + (data.message || 'Unknown error'));
          }
        } catch (error) {
          console.error('Clear data error:', error);
          alert('❌ Error clearing data: ' + error.message);
        }
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
      <div className="mb-8 pl-16 lg:pl-0">
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
                    Import startups from Excel or CSV file
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowImportModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Import
              </motion.button>
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

      {/* Import Startups Modal */}
      <AnimatePresence>
        {showImportModal && (
          <ImportStartups
            onClose={() => setShowImportModal(false)}
            onImport={handleImportStartups}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
