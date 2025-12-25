import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, GraduationCap, Lock, TrendingUp, Award, Eye, X, ChevronDown, ChevronUp, BarChart3, History, CheckCircle, Users, DollarSign, FileText, Loader2 } from 'lucide-react';
import { startupApi } from '../utils/api';
import { exportStartupsComprehensive, filterByDateRange, generateExportFileName } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import DateRangeFilter from './DateRangeFilter';
import StartupGridCard from './StartupGridCard';
import ViewToggle from './ViewToggle';
import StartupProgressModal from './StartupProgressModal';
import GuestRestrictedButton from './GuestRestrictedButton';
import AchievementManager from './AchievementManager';
import HistoryPanel from './HistoryPanel';
import AdminAuthModal from './AdminAuthModal';

// Helper function to handle viewing/downloading base64 data URLs
const handleViewAttachment = (mediaUrl, title) => {
  if (!mediaUrl) return;
  
  if (mediaUrl.startsWith('data:')) {
    const matches = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        window.open(blobUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = title || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  } else {
    window.open(mediaUrl, '_blank');
  }
};

// Check if mediaUrl is an image
const isImageUrl = (url) => {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

export default function Graduated({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [viewMode, setViewMode] = useState('list');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminAuthModal, setAdminAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });

  useEffect(() => {
    loadStartups();
  }, []);

  // Memoized filtering - no separate state needed
  const filteredStartups = useMemo(() => {
    let filtered = startups;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.companyName?.toLowerCase().includes(searchLower) ||
        s.founderName?.toLowerCase().includes(searchLower) ||
        s.sector?.toLowerCase().includes(searchLower)
      );
    }
    if (dateRange.fromDate || dateRange.toDate) {
      filtered = filterByDateRange(filtered, 'graduatedDate', dateRange.fromDate, dateRange.toDate);
    }
    return filtered;
  }, [startups, searchTerm, dateRange]);

  const loadStartups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await startupApi.getAll({ status: 'Graduated' });
      setStartups(data.filter(s => s.status === 'Graduated'));
    } catch (error) {
      console.error('Error loading startups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = (format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Graduated Startups',
      message: 'Please authenticate to export graduated startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        const fileName = generateExportFileName('Graduated-Startups', dateRange.fromDate, dateRange.toDate);
        exportStartupsComprehensive(filteredStartups, format, fileName.replace('MAGIC-', ''));
        alert(`${filteredStartups.length} graduated startup(s) exported as ${format.toUpperCase()}!`);
      }
    });
  };

  const handleUpdateStartup = useCallback(async (updatedStartup) => {
    // Reload startups to get fresh data from database - single API call
    const data = await startupApi.getAll({ status: 'Graduated' });
    const freshData = data.filter(s => s.status === 'Graduated');
    setStartups(freshData);
    
    // Update the modal's startup data if it's open
    if (showAchievementModal && updatedStartup?.id === showAchievementModal.id) {
      const updatedModalStartup = freshData.find(s => s.id === showAchievementModal.id);
      if (updatedModalStartup) {
        setShowAchievementModal(updatedModalStartup);
      }
    }
    if (showProgressModal && updatedStartup?.id === showProgressModal.id) {
      const updatedModalStartup = freshData.find(s => s.id === showProgressModal.id);
      if (updatedModalStartup) {
        setShowProgressModal(updatedModalStartup);
      }
    }
    if (selectedStartup && updatedStartup?.id === selectedStartup.id) {
      const updatedModalStartup = freshData.find(s => s.id === selectedStartup.id);
      if (updatedModalStartup) {
        setSelectedStartup(updatedModalStartup);
      }
    }
  }, [showAchievementModal, showProgressModal, selectedStartup]);

  // Memoized grid columns
  const gridColumns = useMemo(() => {
    const count = filteredStartups.length;
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    if (count <= 12) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';
  }, [filteredStartups.length]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pl-16 lg:pl-0">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Graduated Startups
            </h1>
            <p className="text-white mt-2 text-sm sm:text-base">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-3 text-white">Loading startups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pl-16 lg:pl-0">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Graduated Startups
          </h1>
          <p className="text-white mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} completed incubation
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
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>
        <DateRangeFilter 
          variant="inline"
          onDateRangeChange={setDateRange}
        />
        <button
          onClick={() => setShowHistoryPanel(true)}
          className="flex items-center space-x-2 px-4 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
          title="View section history"
        >
          <History className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">History</span>
        </button>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={`grid ${gridColumns} gap-3 sm:gap-4`}>
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
        </div>
      )}

      {/* List View - View Only */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredStartups.map(startup => {
              // First check revenueEntries (new format from RevenueManager), then revenueHistory, then totalRevenue
              const totalRevenue = 
                (startup.revenueEntries?.length > 0 ? startup.revenueEntries.reduce((sum, r) => sum + (r.amount || 0), 0) : null) ??
                (startup.revenueHistory?.length > 0 ? startup.revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0) : null) ??
                startup.totalRevenue ?? 0;
              
              return (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-2xl shadow-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <GraduationCap className="w-8 h-8" />
                        <div>
                          <h3 className="text-xl font-bold">{startup.companyName}</h3>
                          <p className="text-white/90 text-sm">Founder: {startup.founderName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-semibold">View Only</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-4">
                    {/* Locked Banner */}
                    <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                      <Lock className="w-5 h-5 text-purple-600" />
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        This startup has graduated. Data is locked and view-only.
                      </p>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                        <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-1" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ₹{totalRevenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                        <Award className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {startup.achievements?.length || 0}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Achievements</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                        <GraduationCap className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {startup.graduatedDate ? new Date(startup.graduatedDate).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Graduated</p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">City:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.city}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Sector:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.sector}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Magic Code:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{startup.magicCode}</p>
                      </div>
                    </div>

                    {/* Achievements (View Only) */}
                    {startup.achievements && startup.achievements.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                          <Award className="w-4 h-4 text-blue-500" />
                          <span>Achievements</span>
                        </h4>
                        <div className="space-y-2">
                          {startup.achievements.map((ach, idx) => (
                            <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                              <p className="font-medium text-gray-900 dark:text-white">{ach.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{ach.description}</p>
                              {ach.mediaUrl && (
                                <div className="mt-2">
                                  {isImageUrl(ach.mediaUrl) ? (
                                    <img 
                                      src={ach.mediaUrl} 
                                      alt={ach.title}
                                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                      onClick={() => handleViewAttachment(ach.mediaUrl, ach.title)}
                                      onError={(e) => e.target.style.display = 'none'}
                                    />
                                  ) : (
                                    <button 
                                      onClick={() => handleViewAttachment(ach.mediaUrl, ach.title)}
                                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>View Attachment</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revenue History (View Only) - Check both revenueEntries and revenueHistory */}
                    {((startup.revenueEntries && startup.revenueEntries.length > 0) || (startup.revenueHistory && startup.revenueHistory.length > 0)) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Revenue History</span>
                        </h4>
                        <div className="space-y-2">
                          {(startup.revenueEntries || startup.revenueHistory || []).map((rev, idx) => (
                            <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{rev.source || 'Revenue'}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{rev.date ? new Date(rev.date).toLocaleDateString() : 'No date'}</p>
                              </div>
                              <span className="font-bold text-green-600">₹{rev.amount?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                      <GuestRestrictedButton
                        isGuest={isGuest}
                        onClick={() => setShowProgressModal(startup)}
                        actionType="edit"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Update Progress</span>
                      </GuestRestrictedButton>
                      <GuestRestrictedButton
                        isGuest={isGuest}
                        onClick={() => setShowAchievementModal(startup)}
                        actionType="edit"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <Award className="w-4 h-4" />
                        <span>Add Achievement</span>
                      </GuestRestrictedButton>
                      <button
                        onClick={() => setSelectedStartup(startup)}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Full Details</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {filteredStartups.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl"
        >
          <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">
            No graduated startups found
          </p>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showProgressModal && (
          <StartupProgressModal
            startup={showProgressModal}
            onClose={() => setShowProgressModal(null)}
            onSave={handleUpdateStartup}
          />
        )}
        {showAchievementModal && (
          <AchievementModalWrapper
            startup={showAchievementModal}
            onClose={() => setShowAchievementModal(null)}
            onUpdate={handleUpdateStartup}
            isGuest={isGuest}
          />
        )}
        {selectedStartup && (
          <GraduatedDetailModal
            startup={selectedStartup}
            onClose={() => setSelectedStartup(null)}
            onUpdate={handleUpdateStartup}
            isGuest={isGuest}
          />
        )}
        <AdminAuthModal
          isOpen={adminAuthModal.isOpen}
          onClose={() => setAdminAuthModal({ ...adminAuthModal, isOpen: false })}
          onConfirm={adminAuthModal.onConfirm}
          title={adminAuthModal.title}
          message={adminAuthModal.message}
          actionType={adminAuthModal.actionType}
        />

        <HistoryPanel
          isOpen={showHistoryPanel}
          onClose={() => setShowHistoryPanel(false)}
          sectionType="graduated"
          title="Graduated Section History"
        />
      </AnimatePresence>
    </div>
  );
}

// Detail Modal for Graduated Startups (with Achievement Management)
function GraduatedDetailModal({ startup, onClose, onUpdate, isGuest = false }) {
  const [expanded, setExpanded] = useState({
    startup: true,
    founder: true,
    registration: false,
    achievements: true,
    revenue: true,
    pitchHistory: false,
    oneOnOne: false,
    progressTracking: true,
    onboarding: true
  });
  const [showProgressModal, setShowProgressModal] = useState(false);

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // First check revenueEntries (new format from RevenueManager), then revenueHistory, then totalRevenue
  const totalRevenue = 
    (startup.revenueEntries?.length > 0 ? startup.revenueEntries.reduce((sum, r) => sum + (r.amount || 0), 0) : null) ??
    (startup.revenueHistory?.length > 0 ? startup.revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0) : null) ??
    startup.totalRevenue ?? 0;

  const Section = ({ title, section, children, icon: Icon }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-center space-x-2">
          {Icon && <Icon className="w-5 h-5" />}
          <span>{title}</span>
        </span>
        {expanded[section] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {expanded[section] && (
        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 space-y-2">
          {children}
        </div>
      )}
    </div>
  );

  const Field = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm sm:text-base text-gray-900 dark:text-white break-words">{value || 'N/A'}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-10 h-10" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">{startup.companyName}</h2>
                <p className="text-white/90">Magic Code: {startup.magicCode}</p>
                <p className="text-white/80 text-sm">{startup.city} • {startup.sector}</p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-semibold">Graduated</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Graduated Banner */}
          <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
            <GraduationCap className="w-6 h-6 text-purple-600" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-200">Graduated Startup</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Graduated on: {startup.graduatedDate ? new Date(startup.graduatedDate).toLocaleDateString() : 'N/A'}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                You can add achievements and update progress for graduated startups
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-green-600 mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
              <Award className="w-6 h-6 mx-auto text-blue-600 mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{startup.achievements?.length || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Achievements</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center">
              <GraduationCap className="w-6 h-6 mx-auto text-purple-600 mb-2" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">{startup.oneOnOneHistory?.length || 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Mentorship Sessions</p>
            </div>
          </div>

          {/* Startup Information */}
          <Section title="Startup Information" section="startup">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company Name" value={startup.companyName} />
              <Field label="Magic Code" value={startup.magicCode} />
              <Field label="City" value={startup.city} />
              <Field label="Sector" value={startup.sector} />
              <Field label="Domain" value={startup.domain} />
              <Field label="Team Size" value={startup.teamSize} />
              <Field label="Stage of Idea" value={startup.stageOfIdea} />
              <Field label="Is Registered" value={startup.isRegistered} />
              <Field label="Has Patent" value={startup.hasPatent} />
              {startup.hasPatent === 'Yes' && <Field label="Patent Number" value={startup.patentNumber} />}
              <Field label="Website" value={startup.website} />
              <Field label="Target Customer" value={startup.targetCustomer} />
            </div>
            <Field label="Problem Solving" value={startup.problemSolving} />
            <Field label="Solution" value={startup.solution} />
          </Section>

          {/* Founder Information */}
          <Section title="Founder Information" section="founder">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Founder Name" value={startup.founderName} />
              <Field label="Age" value={startup.founderAge} />
              <Field label="Gender" value={startup.founderGender} />
              <Field label="Email" value={startup.founderEmail || startup.email} />
              <Field label="Mobile" value={startup.founderMobile || startup.mobile} />
              <Field label="Education" value={startup.education} />
              <Field label="College" value={startup.college} />
            </div>
            <Field label="Address" value={startup.address} />
          </Section>

          {/* Onboard Details Section */}
          <Section title="Onboard Details" section="onboarding" icon={FileText}>
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700">
              <div className="space-y-3">
                <div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">Description</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                    {startup.onboardingDescription || 'N/A'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Agreement Date" value={startup.agreementDate ? new Date(startup.agreementDate).toLocaleDateString() : 'N/A'} />
                  <Field label="Engagement Medium" value={startup.engagementMedium || 'N/A'} />
                  <Field label="Onboarded On" value={startup.onboardedDate ? new Date(startup.onboardedDate).toLocaleDateString() : 'N/A'} />
                </div>
                {startup.agreementCopy && typeof startup.agreementCopy === 'string' && startup.agreementCopy.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold block mb-2">
                      Agreement Copy
                    </span>
                    {startup.agreementCopy.startsWith('data:image') ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <img
                          src={startup.agreementCopy}
                          alt="Agreement Copy"
                          className="max-h-64 mx-auto object-contain rounded"
                        />
                        <a
                          href={startup.agreementCopy}
                          download={`${startup.companyName}-agreement.jpg`}
                          className="mt-3 inline-flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Agreement</span>
                        </a>
                      </div>
                    ) : startup.agreementCopy.startsWith('data:application/pdf') ? (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Download className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">PDF Document</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agreement copy uploaded</p>
                          </div>
                        </div>
                        <a
                          href={startup.agreementCopy}
                          download={`${startup.companyName}-agreement.pdf`}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Agreement PDF</span>
                        </a>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Document File</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Agreement copy uploaded</p>
                          </div>
                        </div>
                        <a
                          href={startup.agreementCopy}
                          download={`${startup.companyName}-agreement`}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Agreement Copy</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {(!startup.agreementCopy || typeof startup.agreementCopy !== 'string' || startup.agreementCopy.length === 0) && (
                  <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold block mb-2">
                      Agreement Copy
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No agreement copy uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Achievements - Editable */}
          <Section title="Achievements & Updates" section="achievements" icon={Award}>
            <AchievementManager 
              startup={startup} 
              onUpdate={onUpdate}
              isGuest={isGuest}
            />
          </Section>

          {/* Progress Tracking Section */}
          <Section title="Progress Tracking" section="progressTracking" icon={BarChart3}>
            <div className="space-y-4">
              {/* Update Progress Button */}
              <div className="flex justify-end">
                <GuestRestrictedButton
                  isGuest={isGuest}
                  onClick={() => setShowProgressModal(true)}
                  actionType="edit"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Update Progress</span>
                </GuestRestrictedButton>
              </div>

              {/* Progress History Display */}
              {startup.progressHistory && startup.progressHistory.length > 0 ? (
                <div className="space-y-4">
                  {startup.progressHistory.slice().reverse().map((record, index) => {
                    // Parse notes from the progress record
                    let notes = {};
                    try {
                      notes = typeof record.notes === 'string' ? JSON.parse(record.notes) : (record.notes || {});
                    } catch (e) {
                      notes = {};
                    }
                    
                    const hasProgressData = notes.proofOfConcept || notes.prototypeDevelopment || notes.productDevelopment || notes.fieldTrials || notes.marketLaunch;
                    const hasMetrics = notes.numberOfEmployees || notes.ipRegistrations || notes.gemPortalProducts || notes.successStories;
                    const hasFunding = notes.loans || notes.angelFunding || notes.vcFunding || notes.quarterlyTurnover || notes.quarterlyGST;
                    
                    return (
                      <div key={record.id || index} className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Progress Update - {record.date ? new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}</span>
                          </h4>
                        </div>
                        
                        {/* Section 1: Progress of Startup */}
                        {hasProgressData && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>1. Progress of Startup</span>
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              {notes.proofOfConcept && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Proof of Concept</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.proofOfConcept}</p>
                                </div>
                              )}
                              {notes.prototypeDevelopment && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Prototype Development</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.prototypeDevelopment}</p>
                                </div>
                              )}
                              {notes.productDevelopment && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Product Development</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.productDevelopment}</p>
                                </div>
                              )}
                              {notes.fieldTrials && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Field Trials</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.fieldTrials}</p>
                                </div>
                              )}
                              {notes.marketLaunch && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Market Launch</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.marketLaunch}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Section 2: Other Metrics */}
                        {hasMetrics && (
                          <div className="mb-4">
                            <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>2. Other Metrics</span>
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              {notes.numberOfEmployees && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Number of Employees</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.numberOfEmployees}</p>
                                </div>
                              )}
                              {notes.ipRegistrations && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">IP Registrations</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.ipRegistrations}</p>
                                </div>
                              )}
                              {notes.gemPortalProducts && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">GeM Portal Products</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.gemPortalProducts}</p>
                                </div>
                              )}
                            </div>
                            {notes.successStories && (
                              <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Success Stories</span>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{notes.successStories}</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Section 3: Funds Raised */}
                        {hasFunding && (
                          <div>
                            <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>3. Funds Raised</span>
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                              {notes.loans && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Loans (INR)</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.loans}</p>
                                </div>
                              )}
                              {notes.angelFunding && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Angel Funding (INR)</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.angelFunding}</p>
                                </div>
                              )}
                              {notes.vcFunding && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">VC Funding (INR)</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.vcFunding}</p>
                                </div>
                              )}
                              {notes.quarterlyTurnover && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Quarterly Turnover (INR)</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.quarterlyTurnover}</p>
                                </div>
                              )}
                              {notes.quarterlyGST && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Quarterly GST (INR)</span>
                                  <p className="font-medium text-gray-900 dark:text-white">{notes.quarterlyGST}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Show message if no data in any section */}
                        {!hasProgressData && !hasMetrics && !hasFunding && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No detailed progress data available for this entry.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No progress updates recorded yet.</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Update Progress" to add the first progress entry.</p>
                </div>
              )}
            </div>
          </Section>

          {/* Revenue History - Check both revenueEntries and revenueHistory */}
          {((startup.revenueEntries && startup.revenueEntries.length > 0) || (startup.revenueHistory && startup.revenueHistory.length > 0)) && (
            <Section title="Revenue History" section="revenue" icon={TrendingUp}>
              <div className="space-y-3">
                {(startup.revenueEntries || startup.revenueHistory || []).map((rev, idx) => (
                  <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{rev.source || 'Revenue'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rev.date ? new Date(rev.date).toLocaleDateString() : 'No date'}</p>
                      {rev.description && <p className="text-xs text-gray-500">{rev.description}</p>}
                    </div>
                    <span className="text-lg font-bold text-green-600">₹{rev.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Registration Info */}
          <Section title="Registration Info" section="registration">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Registration Date" value={startup.registrationDate} />
              <Field label="Onboarded Date" value={startup.onboardedDate ? new Date(startup.onboardedDate).toLocaleDateString() : 'N/A'} />
              <Field label="Graduated Date" value={startup.graduatedDate ? new Date(startup.graduatedDate).toLocaleDateString() : 'N/A'} />
              <Field label="Referred From" value={startup.referredFrom || startup.registrationReferredFrom} />
            </div>
            <Field label="Follow-up Remark" value={startup.followUpRemark} />
          </Section>

          {/* Pitch History */}
          {startup.pitchHistory && startup.pitchHistory.length > 0 && (
            <Section title="Pitch History" section="pitchHistory">
              <div className="space-y-3">
                {startup.pitchHistory.map((pitch, idx) => (
                  <div key={idx} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <p className="font-semibold text-gray-900 dark:text-white">Stage: {pitch.stage}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <p><span className="text-gray-500">Date:</span> {pitch.date}</p>
                      <p><span className="text-gray-500">Time:</span> {pitch.time}</p>
                      <p><span className="text-gray-500">Panelist:</span> {pitch.panelistName}</p>
                    </div>
                    <p className="text-sm mt-2"><span className="text-gray-500">Feedback:</span> {pitch.feedback}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* One-on-One History */}
          {startup.oneOnOneHistory && startup.oneOnOneHistory.length > 0 && (
            <Section title="One-on-One Sessions" section="oneOnOne">
              <div className="space-y-3">
                {startup.oneOnOneHistory.map((session, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><span className="text-gray-500">Date:</span> {session.date}</p>
                      <p><span className="text-gray-500">Time:</span> {session.time}</p>
                      {session.mentorName && <p><span className="text-gray-500">Mentor:</span> {session.mentorName}</p>}
                    </div>
                    {session.feedback && <p className="text-sm mt-2"><span className="text-gray-500">Feedback:</span> {session.feedback}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>

      {/* Progress Modal */}
      <AnimatePresence>
        {showProgressModal && (
          <StartupProgressModal
            startup={startup}
            onClose={() => setShowProgressModal(false)}
            onSave={(updatedStartup) => {
              onUpdate(updatedStartup);
              setShowProgressModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// Achievement Modal Wrapper for Quick Achievement Addition
function AchievementModalWrapper({ startup, onClose, onUpdate, isGuest }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 sm:p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Award className="w-10 h-10" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Add Achievement</h2>
                <p className="text-white/90">{startup.companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AchievementManager 
            startup={startup} 
            onUpdate={(updatedStartup) => {
              onUpdate(updatedStartup);
              onClose();
            }}
            isGuest={isGuest}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
