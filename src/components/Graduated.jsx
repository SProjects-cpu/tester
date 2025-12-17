import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, GraduationCap, Lock, TrendingUp, Award, Eye, X, ChevronDown, ChevronUp, BarChart3, FileJson, FileSpreadsheet } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupGridCard from './StartupGridCard';
import ViewToggle from './ViewToggle';
import StartupProgressModal from './StartupProgressModal';
import GuestRestrictedButton from './GuestRestrictedButton';
import AchievementManager from './AchievementManager';
import AdminAuthModal from './AdminAuthModal';

export default function Graduated({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(null);
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
    const data = storage.get('startups', []).filter(s => s.status === 'Graduated');
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
      title: 'Export Graduated Startups',
      message: 'Please authenticate to export graduated startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        exportStartupsComprehensive(filteredStartups, format, 'Graduated-Startups');
        alert(`Graduated startups exported as ${format.toUpperCase()}!`);
      }
    });
  };

  const handleUpdateStartup = (updatedStartup) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => s.id === updatedStartup.id ? updatedStartup : s);
    storage.set('startups', updated);
    loadStartups();
  };

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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Graduated Startups
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
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

      {/* List View - View Only */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredStartups.map(startup => {
              const totalRevenue = startup.totalRevenue || (startup.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;
              
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

                    {/* Progress Tracking Display */}
                    {startup.progressTracking && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 space-y-2">
                        <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4" />
                          <span>PROGRESS TRACKING</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {startup.progressTracking.proofOfConcept && startup.progressTracking.proofOfConcept !== 'Not started' && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">PoC:</span>
                              <p className="font-semibold text-gray-900 dark:text-white text-xs">{startup.progressTracking.proofOfConcept}</p>
                            </div>
                          )}
                          {startup.progressTracking.marketLaunch && startup.progressTracking.marketLaunch !== 'Not started' && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Market:</span>
                              <p className="font-semibold text-gray-900 dark:text-white text-xs">{startup.progressTracking.marketLaunch}</p>
                            </div>
                          )}
                          {startup.progressTracking.numberOfEmployees && (
                            <div className="bg-white dark:bg-gray-700 p-2 rounded">
                              <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                              <p className="font-semibold text-gray-900 dark:text-white text-xs">{startup.progressTracking.numberOfEmployees}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revenue History (View Only) */}
                    {startup.revenueHistory && startup.revenueHistory.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Revenue History</span>
                        </h4>
                        <div className="space-y-2">
                          {startup.revenueHistory.map((rev, idx) => (
                            <div key={idx} className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{rev.source}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{rev.date}</p>
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
    oneOnOne: false
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const totalRevenue = startup.totalRevenue || (startup.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;

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

          {/* Achievements - Editable */}
          <Section title="Achievements & Updates" section="achievements" icon={Award}>
            <AchievementManager 
              startup={startup} 
              onUpdate={onUpdate}
              isGuest={isGuest}
            />
          </Section>

          {/* Revenue History */}
          {startup.revenueHistory && startup.revenueHistory.length > 0 && (
            <Section title="Revenue History" section="revenue" icon={TrendingUp}>
              <div className="space-y-3">
                {startup.revenueHistory.map((rev, idx) => (
                  <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{rev.source}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rev.date}</p>
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
