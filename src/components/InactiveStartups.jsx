import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Mail, Phone, Calendar, TrendingDown, RefreshCw, Download, FileJson, FileSpreadsheet, ChevronDown, History, Loader2 } from 'lucide-react';
import { startupApi } from '../utils/api';
import { exportStartupsComprehensive, filterByDateRange, generateExportFileName } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import DateRangeFilter from './DateRangeFilter';
import HistoryPanel from './HistoryPanel';

export default function InactiveStartups() {
  const [inactiveStartups, setInactiveStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const handleExport = useCallback((format) => {
    // Export the already filtered data (filtered by inline date filter)
    const fileName = generateExportFileName('Inactive-Startups', dateRange.fromDate, dateRange.toDate);
    exportStartupsComprehensive(filteredStartups, format, fileName.replace('MAGIC-', ''));
    alert(`${filteredStartups.length} inactive startup(s) exported as ${format.toUpperCase()}!`);
  }, [filteredStartups, dateRange]);

  const checkInactiveStartups = useCallback(async () => {
    setLoading(true);
    try {
      const startups = await startupApi.getAll();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const inactive = startups.filter(startup => {
        const eligibleStages = ['S0', 'S1', 'S2', 'S3', 'One-on-One'];
        if (!eligibleStages.includes(startup.stage) || 
            startup.status === 'Onboarded' || 
            startup.status === 'Graduated' ||
            startup.status === 'Rejected') {
          return false;
        }
        const lastActivity = new Date(startup.updatedAt || startup.createdAt);
        return lastActivity < thirtyDaysAgo;
      }).map(startup => ({
        ...startup,
        lastActivityDate: new Date(startup.updatedAt || startup.createdAt).toLocaleDateString(),
        lastActivityType: 'Last Update',
        daysSinceActivity: Math.floor((now - new Date(startup.updatedAt || startup.createdAt)) / (1000 * 60 * 60 * 24))
      }));

      setInactiveStartups(inactive);
    } catch (error) {
      console.error('Error checking inactive startups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkInactiveStartups();
  }, [checkInactiveStartups]);

  // Memoized filtered startups
  const filteredStartups = useMemo(() => {
    let filtered = filter === 'all' 
      ? inactiveStartups 
      : inactiveStartups.filter(s => {
          if (filter === 'oneOnOne') return s.stage === 'One-on-One';
          return s.stage === filter.toUpperCase();
        });
    
    // Apply date range filter on updatedAt (fallback to createdAt)
    if (dateRange.fromDate || dateRange.toDate) {
      let dateFiltered = filterByDateRange(filtered, 'updatedAt', dateRange.fromDate, dateRange.toDate);
      if (dateFiltered.length === 0) {
        dateFiltered = filterByDateRange(filtered, 'createdAt', dateRange.fromDate, dateRange.toDate);
      }
      filtered = dateFiltered;
    }
    
    return filtered;
  }, [inactiveStartups, filter, dateRange]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: inactiveStartups.length,
    s0: inactiveStartups.filter(s => s.stage === 'S0').length,
    s1: inactiveStartups.filter(s => s.stage === 'S1').length,
    s2: inactiveStartups.filter(s => s.stage === 'S2').length,
    s3: inactiveStartups.filter(s => s.stage === 'S3').length,
    oneOnOne: inactiveStartups.filter(s => s.stage === 'One-on-One').length
  }), [inactiveStartups]);

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

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-16 lg:pl-0">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Inactive Startups
            </h1>
            <p className="text-white mt-2 text-sm sm:text-base">
              Startups with no activity for more than 30 days
            </p>
          </div>
          <div className="flex gap-3">
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
            <ExportMenu onExport={handleExport} title="Export" formats={['pdf', 'json', 'csv', 'excel']} />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={checkInactiveStartups}
              className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-semibold">
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, filterVal: 'all', color: 'from-orange-500 to-red-500' },
          { label: 'S0', value: stats.s0, filterVal: 's0', color: 'from-gray-500 to-gray-600' },
          { label: 'S1', value: stats.s1, filterVal: 's1', color: 'from-blue-500 to-blue-600' },
          { label: 'S2', value: stats.s2, filterVal: 's2', color: 'from-purple-500 to-purple-600' },
          { label: 'S3', value: stats.s3, filterVal: 's3', color: 'from-orange-500 to-orange-600' },
          { label: '1-on-1', value: stats.oneOnOne, filterVal: 'oneOnOne', color: 'from-indigo-500 to-indigo-600' }
        ].map((stat, index) => (
          <motion.div key={stat.filterVal} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03 }} onClick={() => setFilter(stat.filterVal)}
            className={`cursor-pointer p-4 rounded-xl shadow-lg transition-all ${filter === stat.filterVal ? `bg-gradient-to-r ${stat.color} text-white` : 'bg-white dark:bg-gray-800 hover:shadow-xl'}`}>
            <div className={`text-2xl font-bold ${filter === stat.filterVal ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{stat.value}</div>
            <div className={`text-sm ${filter === stat.filterVal ? 'text-white/90' : 'text-gray-600 dark:text-gray-400'}`}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto text-orange-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading inactive startups...</p>
        </div>
      )}

      {!loading && filteredStartups.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-200 dark:border-green-700">
          <TrendingDown className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">Great News!</h3>
          <p className="text-green-600 dark:text-green-400">
            {filter === 'all' ? 'No inactive startups found. All startups are active!' : `No inactive startups in ${filter.toUpperCase()} stage.`}
          </p>
        </motion.div>
      )}

      {!loading && filteredStartups.length > 0 && (
        <div className="space-y-4">
          {filteredStartups.map((startup, index) => (
            <motion.div key={startup.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{startup.companyName}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStageColor(startup.stage)}`}>{startup.stage}</span>
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold">
                            {startup.daysSinceActivity} days inactive
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div><span className="text-gray-500 dark:text-gray-400">Founder:</span><p className="font-medium text-gray-900 dark:text-white">{startup.founderName}</p></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Sector:</span><p className="font-medium text-gray-900 dark:text-white">{startup.sector}</p></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Last Activity:</span><p className="font-medium text-gray-900 dark:text-white">{startup.lastActivityDate}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 sm:min-w-[200px]">
                    <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={`mailto:${startup.founderEmail}`}
                      className="flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors">
                      <Mail className="w-4 h-4" /><span>Send Email</span>
                    </motion.a>
                    <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={`tel:${startup.founderMobile}`}
                      className="flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                      <Phone className="w-4 h-4" /><span>Call Now</span>
                    </motion.a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <HistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        sectionType="inactive"
        title="Inactive Section History"
      />
    </div>
  );
}
