import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Search, History, Loader2, Eye } from 'lucide-react';
import { startupApi } from '../utils/api';
import { exportStartupsComprehensive, filterByDateRange, generateExportFileName } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import DateRangeFilter from './DateRangeFilter';
import StartupGridCard from './StartupGridCard';
import ViewToggle from './ViewToggle';
import HistoryPanel from './HistoryPanel';
import AdminAuthModal from './AdminAuthModal';
import StartupDetailModal from './StartupDetailModal';
import { PageHeader } from './shared/PageHeader';

export default function Quit({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [yearFilter, setYearFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminAuthModal, setAdminAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, []);

  useEffect(() => {
    loadStartups();
  }, []);

  // Memoized filtering
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
    
    if (yearFilter !== 'all') {
      filtered = filtered.filter(s => {
        const quitYear = s.quitDate ? new Date(s.quitDate).getFullYear() : null;
        return quitYear === parseInt(yearFilter);
      });
    }
    
    if (dateRange.fromDate || dateRange.toDate) {
      filtered = filterByDateRange(filtered, 'quitDate', dateRange.fromDate, dateRange.toDate);
    }
    
    return filtered;
  }, [startups, searchTerm, yearFilter, dateRange]);

  const loadStartups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await startupApi.getAll({ status: 'Quit' });
      setStartups(data.filter(s => s.status === 'Quit' || s.stage === 'Quit'));
    } catch (error) {
      console.error('Error loading quit startups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = (format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Quit Startups',
      message: 'Please authenticate to export quit startup data.',
      actionType: 'info',
      onConfirm: () => {
        const fileName = generateExportFileName('Quit-Startups', dateRange.fromDate, dateRange.toDate);
        exportStartupsComprehensive(filteredStartups, format, fileName.replace('MAGIC-', ''));
        alert(`${filteredStartups.length} quit startup(s) exported as ${format.toUpperCase()}!`);
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Quit Startups"
          gradientColors="from-gray-600 to-gray-800"
          count={0}
          countLabel="startup"
          subtitle="Loading..."
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-3 text-white">Loading startups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pl-16 lg:pl-0">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Quit Startups
          </h1>
          <p className="text-white mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} have quit the program
          </p>
        </div>
        <ExportMenu 
          onExport={handleExport}
          title="Export"
          formats={['pdf', 'csv', 'excel']}
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
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>
        
        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 outline-none"
        >
          <option value="all">All Years</option>
          {yearOptions.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredStartups.map(startup => (
            <StartupGridCard
              key={startup.id}
              startup={startup}
              onUpdate={() => loadStartups()}
              onDelete={() => {}}
              onClick={() => setSelectedStartup(startup)}
              isGuest={isGuest}
            />
          ))}
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
                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gray-500 to-gray-700 p-4 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <DoorOpen className="w-8 h-8" />
                      <div>
                        <h3 className="text-xl font-bold">{startup.companyName}</h3>
                        <p className="text-white/90 text-sm">Founder: {startup.founderName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                        Quit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sector:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{startup.sector}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">City:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{startup.city || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Quit Date:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {startup.quitDate ? new Date(startup.quitDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {startup.quitReason && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Quit Reason:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{startup.quitReason}</p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setSelectedStartup(startup)}
                      className="flex items-center space-x-2 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      <Eye className="w-4 h-4" />
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
          <DoorOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">
            No quit startups found
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedStartup && (
          <StartupDetailModal
            startup={selectedStartup}
            onClose={() => setSelectedStartup(null)}
            onUpdate={() => loadStartups()}
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
          sectionType="quit"
          title="Quit Section History"
        />
      </AnimatePresence>
    </div>
  );
}
