import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, Plus, TrendingUp, Award, GraduationCap, IndianRupee, BarChart3, X, Eye, ChevronDown, FileJson, FileSpreadsheet } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupGridCard from './StartupGridCard';
import StartupDetailModal from './StartupDetailModal';
import ViewToggle from './ViewToggle';
import GuestRestrictedButton from './GuestRestrictedButton';
import StartupProgressModal from './StartupProgressModal';
import AchievementManager from './AchievementManager';
import AdminAuthModal from './AdminAuthModal';

export default function Onboarded({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
  const [showRevenueForm, setShowRevenueForm] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [revenueData, setRevenueData] = useState({ amount: '', source: '', date: '', description: '' });
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
  }, [startups, searchTerm]);

  const loadStartups = () => {
    const data = storage.get('startups', []).filter(s => s.status === 'Onboarded');
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

  const handleExport = (format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Onboarded Startups',
      message: 'Please authenticate to export onboarded startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        exportStartupsComprehensive(filteredStartups, format, 'Onboarded-Startups');
        alert(`Onboarded startups exported as ${format.toUpperCase()}!`);
      }
    });
  };

  const handleUpdateStartup = (updatedStartup) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => s.id === updatedStartup.id ? updatedStartup : s);
    storage.set('startups', updated);
    loadStartups();
  };

  const handleAddAchievement = (startup) => {
    setShowAchievementForm(startup);
    setAchievementData({ title: '', description: '', date: new Date().toISOString().split('T')[0], mediaUrl: '' });
  };

  const submitAchievement = () => {
    if (!achievementData.title || !achievementData.description) {
      alert('Please fill title and description');
      return;
    }
    const startup = showAchievementForm;
    const achievements = startup.achievements || [];
    achievements.push({
      ...achievementData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => 
      s.id === startup.id ? { ...s, achievements } : s
    );
    storage.set('startups', updated);
    setShowAchievementForm(null);
    loadStartups();
    alert('Achievement added successfully!');
  };

  const handleAddRevenue = (startup) => {
    setShowRevenueForm(startup);
    setRevenueData({ amount: '', source: '', date: new Date().toISOString().split('T')[0], description: '' });
  };

  const submitRevenue = () => {
    if (!revenueData.amount || !revenueData.source) {
      alert('Please fill amount and source');
      return;
    }
    const startup = showRevenueForm;
    const revenueHistory = startup.revenueHistory || [];
    revenueHistory.push({
      ...revenueData,
      amount: parseFloat(revenueData.amount),
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    });
    
    // Calculate total revenue
    const totalRevenue = revenueHistory.reduce((sum, r) => sum + r.amount, 0);
    
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => 
      s.id === startup.id ? { ...s, revenueHistory, totalRevenue } : s
    );
    storage.set('startups', updated);
    setShowRevenueForm(null);
    loadStartups();
    alert('Revenue added successfully!');
  };

  const handleGraduate = (startup) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Graduate Startup',
      message: `You are about to graduate "${startup.companyName}". This will lock the startup and mark it as completed. This action cannot be easily undone. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: () => {
        const allStartups = storage.get('startups', []);
        const updated = allStartups.map(s =>
          s.id === startup.id ? { ...s, status: 'Graduated', graduatedDate: new Date().toISOString() } : s
        );
        storage.set('startups', updated);
        loadStartups();
        alert(`✅ ${startup.companyName} has been graduated!`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Onboarded Startups
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} successfully onboarded
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
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm sm:text-base"
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
                        {startup.revenueHistory?.length || 0}
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
                              {ach.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img 
                                  src={ach.mediaUrl} 
                                  alt={ach.title}
                                  className="w-full h-32 object-cover rounded-lg"
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                <a 
                                  href={ach.mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                                >
                                  <span>View Media</span>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Revenue */}
                  {startup.revenueHistory && startup.revenueHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span>Recent Revenue</span>
                      </h4>
                      {startup.revenueHistory.slice(-2).map((rev, idx) => (
                        <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{rev.source}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{rev.date}</p>
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

        {/* Add Revenue Modal */}
        {showRevenueForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRevenueForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span>Add Revenue</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                For: <strong>{showRevenueForm.companyName}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={revenueData.amount}
                    onChange={(e) => setRevenueData({ ...revenueData, amount: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={revenueData.source}
                    onChange={(e) => setRevenueData({ ...revenueData, source: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Product Sales, Funding, Contract"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={revenueData.date}
                    onChange={(e) => setRevenueData({ ...revenueData, date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={revenueData.description}
                    onChange={(e) => setRevenueData({ ...revenueData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Additional details..."
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowRevenueForm(null)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRevenue}
                    className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Add Revenue
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        <AdminAuthModal
          isOpen={adminAuthModal.isOpen}
          onClose={() => setAdminAuthModal({ ...adminAuthModal, isOpen: false })}
          onConfirm={adminAuthModal.onConfirm}
          title={adminAuthModal.title}
          message={adminAuthModal.message}
          actionType={adminAuthModal.actionType}
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
