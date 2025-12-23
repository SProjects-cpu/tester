import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, GraduationCap, IndianRupee, BarChart3, X, Eye, History } from 'lucide-react';
import { startupApi } from '../utils/api';
import { exportStartupsComprehensive, filterByDateRange, generateExportFileName } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupGridCard from './StartupGridCard';
import StartupDetailModal from './StartupDetailModal';
import ViewToggle from './ViewToggle';
import GuestRestrictedButton from './GuestRestrictedButton';
import StartupProgressModal from './StartupProgressModal';
import AchievementManager from './AchievementManager';
import RevenueManager from './RevenueManager';
import HistoryPanel from './HistoryPanel';
import AdminAuthModal from './AdminAuthModal';
import { PageHeader, PAGE_GRADIENTS } from './shared/PageHeader';
import SearchFilterBar from './shared/SearchFilterBar';

// Helper function to handle viewing/downloading base64 data URLs
const handleViewAttachment = (mediaUrl, title) => {
  if (!mediaUrl) return;
  
  // Check if it's a base64 data URL
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

export default function Onboarded({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [viewMode, setViewMode] = useState('list');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showRevenueModal, setShowRevenueModal] = useState(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm, dateRange]);

  const loadStartups = async () => {
    try {
      setLoading(true);
      const data = await startupApi.getAll({ status: 'Onboarded' });
      // Filter for Onboarded status on client side as well
      setStartups(data.filter(s => s.status === 'Onboarded'));
    } catch (error) {
      console.error('Error loading startups:', error);
    } finally {
      setLoading(false);
    }
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
    // Apply date range filter on onboardedDate
    if (dateRange.fromDate || dateRange.toDate) {
      filtered = filterByDateRange(filtered, 'onboardedDate', dateRange.fromDate, dateRange.toDate);
    }
    setFilteredStartups(filtered);
  };

  const handleExport = (format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Onboarded Startups',
      message: 'Please authenticate to export onboarded startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        // Export the already filtered data (filtered by inline date filter)
        const fileName = generateExportFileName('Onboarded-Startups', dateRange.fromDate, dateRange.toDate);
        exportStartupsComprehensive(filteredStartups, format, fileName.replace('MAGIC-', ''));
        alert(`${filteredStartups.length} onboarded startup(s) exported as ${format.toUpperCase()}!`);
      }
    });
  };

  const handleUpdateStartup = async (updatedStartup) => {
    try {
      await startupApi.update(updatedStartup.id, updatedStartup);
      await loadStartups();
    } catch (error) {
      console.error('Error updating startup:', error);
      alert('Failed to update startup: ' + error.message);
    }
  };

  const handleGraduate = (startup) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Graduate Startup',
      message: `You are about to graduate "${startup.companyName}". This will lock the startup and mark it as completed. This action cannot be easily undone. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: async () => {
        try {
          await startupApi.update(startup.id, { 
            stage: 'Graduated',
            status: 'Graduated', 
            graduatedDate: new Date().toISOString() 
          });
          await loadStartups();
          alert(`✅ ${startup.companyName} has been graduated!`);
        } catch (error) {
          console.error('Error graduating startup:', error);
          alert('Failed to graduate startup: ' + error.message);
        }
      }
    });
  };

  const getTotalRevenue = (startup) => {
    if (startup.totalRevenue) return startup.totalRevenue;
    if (startup.revenueHistory) {
      return startup.revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0);
    }
    return 0;
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
      <PageHeader
        title="Onboarded Startups"
        gradientColors={PAGE_GRADIENTS.onboarded}
        count={filteredStartups.length}
        countLabel="startup"
        subtitle={`${filteredStartups.length} startup${filteredStartups.length !== 1 ? 's' : ''} successfully onboarded`}
        actions={
          <ExportMenu 
            onExport={handleExport}
            title="Export"
            formats={['pdf', 'json', 'csv', 'excel']}
          />
        }
      />

      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, founder, or sector..."
        filters={[]}
        filterValues={{}}
        showDateFilter={true}
        onDateRangeChange={setDateRange}
        additionalControls={
          <>
            <button
              onClick={() => setShowHistoryPanel(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              title="View section history"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">History</span>
            </button>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </>
        }
      />

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
        <div className="space-y-4">
          <AnimatePresence>
            {filteredStartups.map(startup => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 border-2 border-green-200 dark:border-green-700 rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold">{startup.companyName}</h3>
                      <p className="text-white/90 text-sm">Founder: {startup.founderName}</p>
                      <p className="text-white/80 text-xs">{startup.city} • {startup.sector}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                        <IndianRupee className="w-4 h-4" />
                        <span className="font-bold">{getTotalRevenue(startup).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-white/80 mt-1">Total Revenue</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Onboarding Details */}
                  {(startup.onboardingDescription || startup.agreementDate || startup.engagementMedium) && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 space-y-3">
                      {startup.onboardingDescription && (
                        <div>
                          <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                            STARTUP DESCRIPTION
                          </h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {startup.onboardingDescription}
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {startup.agreementDate && (
                          <div>
                            <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                              AGREEMENT DATE
                            </h4>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(startup.agreementDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {startup.engagementMedium && (
                          <div>
                            <h4 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                              ENGAGEMENT MEDIUM
                            </h4>
                            <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                              {startup.engagementMedium}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Tracking Display */}
                  {startup.progressTracking && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3">
                      <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>STARTUP PROGRESS TRACKING</span>
                      </h4>
                      
                      {/* Development Progress */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {startup.progressTracking.proofOfConcept && startup.progressTracking.proofOfConcept !== 'Not started' && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Proof of Concept:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.proofOfConcept}</p>
                          </div>
                        )}
                        {startup.progressTracking.prototypeDevelopment && startup.progressTracking.prototypeDevelopment !== 'Not started' && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Prototype:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.prototypeDevelopment}</p>
                          </div>
                        )}
                        {startup.progressTracking.productDevelopment && startup.progressTracking.productDevelopment !== 'Not started' && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Product Dev:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.productDevelopment}</p>
                          </div>
                        )}
                        {startup.progressTracking.fieldTrials && startup.progressTracking.fieldTrials !== 'Not started' && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Field Trials:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.fieldTrials}</p>
                          </div>
                        )}
                        {startup.progressTracking.marketLaunch && startup.progressTracking.marketLaunch !== 'Not started' && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Market Launch:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.marketLaunch}</p>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {startup.progressTracking.numberOfEmployees && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.numberOfEmployees}</p>
                          </div>
                        )}
                        {startup.progressTracking.ipRegistrations && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">IP Registrations:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.ipRegistrations}</p>
                          </div>
                        )}
                        {startup.progressTracking.gemPortalProducts && (
                          <div className="bg-white dark:bg-gray-700 p-2 rounded">
                            <span className="text-gray-600 dark:text-gray-400">GEM Products:</span>
                            <p className="font-semibold text-gray-900 dark:text-white">{startup.progressTracking.gemPortalProducts}</p>
                          </div>
                        )}
                      </div>

                      {/* Funding */}
                      {(startup.progressTracking.loans || startup.progressTracking.angelFunding || startup.progressTracking.vcFunding) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {startup.progressTracking.loans && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Loans:</span>
                              <p className="font-semibold text-green-700 dark:text-green-300">₹{Number(startup.progressTracking.loans).toLocaleString()}</p>
                            </div>
                          )}
                          {startup.progressTracking.angelFunding && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Angel Funding:</span>
                              <p className="font-semibold text-green-700 dark:text-green-300">₹{Number(startup.progressTracking.angelFunding).toLocaleString()}</p>
                            </div>
                          )}
                          {startup.progressTracking.vcFunding && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">VC Funding:</span>
                              <p className="font-semibold text-green-700 dark:text-green-300">₹{Number(startup.progressTracking.vcFunding).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {startup.progressTracking.lastUpdated && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                          Last updated: {new Date(startup.progressTracking.lastUpdated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                      <TrendingUp className="w-5 h-5 mx-auto text-green-600 mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{getTotalRevenue(startup).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Revenue</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                      <Award className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {startup.achievements?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Achievements</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                      <IndianRupee className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {startup.revenueEntries?.length || 0}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Revenue Entries</p>
                    </div>
                  </div>

                  {/* Recent Achievements */}
                  {startup.achievements && startup.achievements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span>Recent Achievements</span>
                      </h4>
                      {startup.achievements.slice(-2).map((ach, idx) => (
                        <div key={idx} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{ach.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{ach.description}</p>
                          </div>
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
                  )}

                  {/* Recent Revenue */}
                  {startup.revenueEntries && startup.revenueEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Recent Revenue</span>
                      </h4>
                      {startup.revenueEntries.slice(-2).map((rev, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{rev.source || 'Revenue'}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{rev.date ? new Date(rev.date).toLocaleDateString() : 'No date'}</p>
                          </div>
                          <span className="font-bold text-green-600">₹{rev.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => setShowProgressModal(startup)}
                      actionType="edit"
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Update Progress</span>
                    </GuestRestrictedButton>
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => setShowRevenueModal(startup)}
                      actionType="edit"
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      <IndianRupee className="w-4 h-4" />
                      <span>Manage Revenue</span>
                    </GuestRestrictedButton>
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => setShowAchievementModal(startup)}
                      actionType="edit"
                      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      <Award className="w-4 h-4" />
                      <span>Add Achievement</span>
                    </GuestRestrictedButton>
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => handleGraduate(startup)}
                      actionType="graduate"
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Graduate</span>
                    </GuestRestrictedButton>
                    <button
                      onClick={() => setSelectedStartup(startup)}
                      className="flex items-center space-x-2 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <span>View Details</span>
                    </button>
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
            No onboarded startups found
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

        {/* Add Achievement Modal */}
        {showAchievementModal && (
          <AchievementModalWrapper
            startup={showAchievementModal}
            onClose={() => setShowAchievementModal(null)}
            onUpdate={handleUpdateStartup}
            isGuest={isGuest}
          />
        )}

        {/* Progress Modal */}
        {showProgressModal && (
          <StartupProgressModal
            startup={showProgressModal}
            onClose={() => setShowProgressModal(null)}
            onSave={handleUpdateStartup}
          />
        )}

        {/* Revenue Modal */}
        {showRevenueModal && (
          <RevenueModalWrapper
            startup={showRevenueModal}
            onClose={() => setShowRevenueModal(null)}
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
          sectionType="onboarded"
          title="Onboarded Section History"
        />
      </AnimatePresence>
    </div>
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
                <h2 className="text-2xl sm:text-3xl font-bold">Manage Achievements</h2>
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

// Revenue Modal Wrapper for Revenue Management
function RevenueModalWrapper({ startup, onClose, onUpdate, isGuest }) {
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 sm:p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <IndianRupee className="w-10 h-10" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Manage Revenue</h2>
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
          <RevenueManager 
            startup={startup} 
            onUpdate={(updatedStartup) => {
              onUpdate(updatedStartup);
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
