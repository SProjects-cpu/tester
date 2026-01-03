import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Users, XCircle, TrendingUp, Calendar, PieChart, ChevronDown, X, CalendarCheck, UserCheck, GraduationCap, UserX, LogOut, AlertTriangle } from 'lucide-react';
import { startupApi, smcApi, fmcApi, oneOnOneApi } from '../utils/api';
import InactiveStartupNotifications from './InactiveStartupNotifications';

// Interactive Pie Chart Component
function SectorPieChart({ sectorStats, onSectorClick, total }) {
  const [hoveredSector, setHoveredSector] = useState(null);
  
  // Color palette for sectors
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', 
    '#06B6D4', '#EF4444', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#A855F7', '#F43F5E', '#22C55E', '#0EA5E9'
  ];

  const sortedSectors = Object.entries(sectorStats)
    .sort((a, b) => b[1] - a[1]);

  // Calculate pie chart segments
  const segments = useMemo(() => {
    let currentAngle = 0;
    return sortedSectors.map(([sector, count], index) => {
      const percentage = (count / total) * 100;
      const angle = (count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      return {
        sector,
        count,
        percentage,
        startAngle,
        endAngle,
        color: colors[index % colors.length]
      };
    });
  }, [sortedSectors, total]);

  // Convert polar to cartesian coordinates
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  // Create SVG arc path
  const createArcPath = (cx, cy, r, startAngle, endAngle, isHovered) => {
    const radius = isHovered ? r + 8 : r;
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  const cx = 150;
  const cy = 150;
  const radius = 120;

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      {/* Pie Chart */}
      <div className="relative">
        <svg width="300" height="300" className="transform -rotate-90">
          {segments.map((segment, index) => (
            <motion.path
              key={segment.sector}
              d={createArcPath(cx, cy, radius, segment.startAngle, segment.endAngle, hoveredSector === segment.sector)}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: hoveredSector === segment.sector ? 1.05 : 1,
                filter: hoveredSector && hoveredSector !== segment.sector ? 'brightness(0.7)' : 'brightness(1)'
              }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onMouseEnter={() => setHoveredSector(segment.sector)}
              onMouseLeave={() => setHoveredSector(null)}
              onClick={() => onSectorClick(segment.sector)}
            />
          ))}
          {/* Center circle for donut effect */}
          <circle cx={cx} cy={cy} r={50} fill="white" className="dark:fill-gray-800" />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {hoveredSector ? (
              <>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {sectorStats[hoveredSector]}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 max-w-[80px] truncate">
                  {hoveredSector}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{total}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Total</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 max-h-[300px] overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {segments.map((segment, index) => (
            <motion.div
              key={segment.sector}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                hoveredSector === segment.sector 
                  ? 'bg-gray-100 dark:bg-gray-700 scale-105' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onMouseEnter={() => setHoveredSector(segment.sector)}
              onMouseLeave={() => setHoveredSector(null)}
              onClick={() => onSectorClick(segment.sector)}
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {segment.sector}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {segment.count} ({segment.percentage.toFixed(1)}%)
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate, onNavigateWithSector }) {
  const [stats, setStats] = useState({
    s0: 0, s1: 0, s2: 0, s3: 0,
    oneOnOne: 0, onboarded: 0, graduated: 0, rejected: 0, quit: 0, inactive: 0, total: 0
  });
  const [meetingStats, setMeetingStats] = useState({
    smc: 0, fmc: 0, oneOnOne: 0, total: 0
  });
  const [sectorStats, setSectorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [allStartups, setAllStartups] = useState([]);
  const [fyFilter, setFyFilter] = useState('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('fy'); // 'fy' | 'custom'

  // Format date to DD-MM-YYYY for display
  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Generate Financial Year options (April to March)
  const fyOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // If we're in Jan-Mar, current FY started last year
    const currentFYStart = currentMonth < 3 ? currentYear - 1 : currentYear;
    const options = [];
    for (let y = currentFYStart; y >= currentFYStart - 5; y--) {
      options.push({
        value: `${y}-${y + 1}`,
        label: `FY ${y}-${String(y + 1).slice(-2)}`,
        startDate: new Date(y, 3, 1), // April 1
        endDate: new Date(y + 1, 2, 31, 23, 59, 59) // March 31
      });
    }
    return options;
  }, []);

  // Get effective date range based on filter mode
  const getEffectiveDateRange = useCallback(() => {
    if (dateFilterMode === 'custom' && (customFromDate || customToDate)) {
      return {
        startDate: customFromDate ? new Date(customFromDate) : null,
        endDate: customToDate ? new Date(customToDate + 'T23:59:59') : null
      };
    }
    if (dateFilterMode === 'fy' && fyFilter !== 'all') {
      const selectedFY = fyOptions.find(fy => fy.value === fyFilter);
      return selectedFY ? { startDate: selectedFY.startDate, endDate: selectedFY.endDate } : null;
    }
    return null;
  }, [dateFilterMode, customFromDate, customToDate, fyFilter, fyOptions]);

  const clearCustomDates = () => {
    setCustomFromDate('');
    setCustomToDate('');
    setDateFilterMode('fy');
    setFyFilter('all');
  };

  const applyCustomDateFilter = () => {
    if (customFromDate || customToDate) {
      setDateFilterMode('custom');
      setFyFilter('all');
    }
    setShowDatePicker(false);
  };

  const handleFYChange = (value) => {
    setFyFilter(value);
    setDateFilterMode('fy');
    setCustomFromDate('');
    setCustomToDate('');
  };

  const fetchStartups = useCallback(async () => {
    try {
      setLoading(true);
      const startups = await startupApi.getAll();
      setAllStartups(startups);
      
      // Fetch meeting counts
      const [smcMeetings, fmcMeetings, oneOnOneMeetings] = await Promise.all([
        smcApi.getAll().catch(() => []),
        fmcApi.getAll().catch(() => []),
        oneOnOneApi.getAll().catch(() => [])
      ]);
      
      setMeetingStats({
        smc: Array.isArray(smcMeetings) ? smcMeetings.length : 0,
        fmc: Array.isArray(fmcMeetings) ? fmcMeetings.length : 0,
        oneOnOne: Array.isArray(oneOnOneMeetings) ? oneOnOneMeetings.length : 0,
        total: (Array.isArray(smcMeetings) ? smcMeetings.length : 0) + 
               (Array.isArray(fmcMeetings) ? fmcMeetings.length : 0) + 
               (Array.isArray(oneOnOneMeetings) ? oneOnOneMeetings.length : 0)
      });
    } catch (error) {
      console.error('Error fetching startups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter startups by financial year or custom date range and calculate stats
  useEffect(() => {
    let filteredStartups = allStartups;
    const dateRange = getEffectiveDateRange();
    
    if (dateRange) {
      filteredStartups = allStartups.filter(s => {
        const createdDate = s.createdAt ? new Date(s.createdAt) : null;
        const onboardedDate = s.onboardedDate ? new Date(s.onboardedDate) : null;
        const registeredDate = s.registeredDate ? new Date(s.registeredDate) : null;
        
        const isInRange = (date) => {
          if (!date) return false;
          const afterStart = !dateRange.startDate || date >= dateRange.startDate;
          const beforeEnd = !dateRange.endDate || date <= dateRange.endDate;
          return afterStart && beforeEnd;
        };
        return isInRange(createdDate) || isInRange(onboardedDate) || isInRange(registeredDate);
      });
    }
    
    const newStats = {
      s0: filteredStartups.filter(s => s.stage === 'S0').length,
      s1: filteredStartups.filter(s => s.stage === 'S1').length,
      s2: filteredStartups.filter(s => s.stage === 'S2').length,
      s3: filteredStartups.filter(s => s.stage === 'S3').length,
      oneOnOne: filteredStartups.filter(s => s.stage === 'One-on-One').length,
      onboarded: filteredStartups.filter(s => s.status === 'Onboarded').length,
      graduated: filteredStartups.filter(s => s.status === 'Graduated').length,
      rejected: filteredStartups.filter(s => s.status === 'Rejected').length,
      quit: filteredStartups.filter(s => s.status === 'Quit' || s.stage === 'Quit').length,
      inactive: filteredStartups.filter(s => s.status === 'Inactive').length,
      total: filteredStartups.length
    };
    
    // Calculate sector statistics
    const sectors = {};
    filteredStartups.forEach(startup => {
      if (startup.sector) {
        sectors[startup.sector] = (sectors[startup.sector] || 0) + 1;
      }
    });
    
    setStats(newStats);
    setSectorStats(sectors);
  }, [allStartups, getEffectiveDateRange]);

  useEffect(() => {
    fetchStartups();
    
    // Refresh data when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchStartups();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchStartups]);

  const cards = [
    { 
      label: 'S0 - Registered', 
      value: stats.s0, 
      borderColor: 'border-gray-500',
      iconColor: 'text-gray-500',
      icon: Rocket,
      page: 'startups'
    },
    { 
      label: 'S1 - Stage 1', 
      value: stats.s1, 
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'S2 - Stage 2', 
      value: stats.s2, 
      borderColor: 'border-purple-500',
      iconColor: 'text-purple-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'S3 - Stage 3', 
      value: stats.s3, 
      borderColor: 'border-orange-500',
      iconColor: 'text-orange-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'One-on-One', 
      value: stats.oneOnOne, 
      borderColor: 'border-indigo-500',
      iconColor: 'text-indigo-500',
      icon: Users,
      page: 'oneOnOne'
    },
    { 
      label: 'Rejected', 
      value: stats.rejected, 
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      icon: XCircle,
      page: 'rejected'
    },
    { 
      label: 'Total Startups', 
      value: stats.total, 
      borderColor: 'border-pink-500',
      iconColor: 'text-pink-500',
      icon: Rocket,
      page: 'startups'
    },
  ];

  // SMC Card with sub-cards (Meetings Overview)
  const smcCard = {
    label: 'SMC',
    value: meetingStats.total,
    borderColor: 'border-cyan-500',
    iconColor: 'text-cyan-500',
    icon: CalendarCheck,
    subCards: [
      { label: 'SMC', value: meetingStats.smc, page: 'smcScheduling' },
      { label: 'FMC', value: meetingStats.fmc, page: 'fmcScheduling' },
      { label: 'One on One', value: meetingStats.oneOnOne, page: 'oneOnOneScheduling' }
    ]
  };

  // Onboard Card with sub-cards (Startup Lifecycle Overview)
  const onboardCard = {
    label: 'Onboard',
    value: stats.onboarded + stats.graduated + stats.inactive + stats.rejected + stats.quit,
    borderColor: 'border-emerald-500',
    iconColor: 'text-emerald-500',
    icon: UserCheck,
    subCards: [
      { label: 'Onboarded', value: stats.onboarded, icon: UserCheck, page: 'onboarded' },
      { label: 'Graduated', value: stats.graduated, icon: GraduationCap, page: 'graduated' },
      { label: 'Inactive', value: stats.inactive, icon: AlertTriangle, page: 'inactive' },
      { label: 'Rejected', value: stats.rejected, icon: UserX, page: 'rejected' },
      { label: 'Quit', value: stats.quit, icon: LogOut, page: 'quit' }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-16 lg:pl-0"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold magic-text-gradient">
            Dashboard
          </h1>
          <p className="text-white mt-2 text-sm sm:text-base font-semibold">
            Welcome to MAGIC Startup Incubation Management System
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Enhanced Date Filter with FY and Custom Range */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                dateFilterMode === 'custom' || fyFilter !== 'all'
                  ? 'bg-green-500/20 border-green-400 text-green-400'
                  : 'bg-white/10 border-white/20 text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-semibold">
                {dateFilterMode === 'custom' && (customFromDate || customToDate)
                  ? `${formatDateDisplay(customFromDate) || 'Start'} - ${formatDateDisplay(customToDate) || 'End'}`
                  : fyFilter !== 'all'
                    ? fyOptions.find(fy => fy.value === fyFilter)?.label
                    : 'All Years'
                }
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 min-w-[320px]"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filter by Date</span>
                      {(customFromDate || customToDate || fyFilter !== 'all') && (
                        <button onClick={clearCustomDates} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                          <X className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    {/* Financial Year Selection */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Financial Year (April - March)</label>
                      <select
                        value={dateFilterMode === 'fy' ? fyFilter : 'all'}
                        onChange={(e) => handleFYChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="all">All Years</option>
                        {fyOptions.map(fy => (
                          <option key={fy.value} value={fy.value}>{fy.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative flex items-center my-3">
                      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                      <span className="px-3 text-xs text-gray-500 dark:text-gray-400">OR</span>
                      <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                    </div>

                    {/* Custom Date Range */}
                    <div className="space-y-3">
                      <label className="block text-xs text-gray-500 dark:text-gray-400">Custom Date Range (DD-MM-YYYY)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                          <input
                            type="date"
                            value={customFromDate}
                            onChange={(e) => setCustomFromDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                          {customFromDate && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">{formatDateDisplay(customFromDate)}</span>}
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                          <input
                            type="date"
                            value={customToDate}
                            onChange={(e) => setCustomToDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
                          />
                          {customToDate && <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">{formatDateDisplay(customToDate)}</span>}
                        </div>
                      </div>
                      <button
                        onClick={applyCustomDateFilter}
                        disabled={!customFromDate && !customToDate}
                        className="w-full mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('startups')}
            className="magic-gradient text-white px-5 sm:px-6 py-3 rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base font-semibold whitespace-nowrap"
          >
            Register New Startup
          </motion.button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.page)}
              className="cursor-pointer"
            >
              <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-200 dark:border-gray-600 border-b-4 ${card.borderColor}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${card.iconColor}`} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                    className={`text-3xl sm:text-4xl font-bold ${card.iconColor}`}
                  >
                    {card.value}
                  </motion.div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">{card.label}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SMC and Onboard Cards with Sub-cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* SMC Card - Meetings Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-600 border-b-4 ${smcCard.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <smcCard.icon className={`w-8 h-8 ${smcCard.iconColor}`} />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{smcCard.label}</h3>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9, type: 'spring' }}
                className={`text-3xl font-bold ${smcCard.iconColor}`}
              >
                {smcCard.value}
              </motion.div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total Meetings</p>
            <div className="grid grid-cols-3 gap-3">
              {smcCard.subCards.map((subCard, idx) => (
                <motion.div
                  key={subCard.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate(subCard.page)}
                  className="cursor-pointer bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <div className={`text-2xl font-bold ${smcCard.iconColor}`}>{subCard.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{subCard.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Onboard Card - Startup Lifecycle Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className={`bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-600 border-b-4 ${onboardCard.borderColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <onboardCard.icon className={`w-8 h-8 ${onboardCard.iconColor}`} />
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{onboardCard.label}</h3>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.0, type: 'spring' }}
                className={`text-3xl font-bold ${onboardCard.iconColor}`}
              >
                {onboardCard.value}
              </motion.div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total Startups</p>
            <div className="grid grid-cols-5 gap-2">
              {onboardCard.subCards.map((subCard, idx) => {
                const SubIcon = subCard.icon;
                return (
                  <motion.div
                    key={subCard.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate(subCard.page)}
                    className="cursor-pointer bg-gray-50 dark:bg-gray-700/50 rounded-xl p-2 sm:p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <SubIcon className={`w-4 h-4 mx-auto mb-1 ${onboardCard.iconColor}`} />
                    <div className={`text-lg sm:text-xl font-bold ${onboardCard.iconColor}`}>{subCard.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">{subCard.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sector Statistics with Interactive Pie Chart */}
      {Object.keys(sectorStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 sm:mt-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="w-8 h-8 text-cyan-500" />
            <h2 className="text-2xl sm:text-3xl font-bold magic-text-gradient">
              Startups by Sector
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-600">
            <SectorPieChart 
              sectorStats={sectorStats} 
              onSectorClick={(sector) => onNavigateWithSector ? onNavigateWithSector('startups', sector) : onNavigate('startups')}
              total={stats.total}
            />
          </div>
        </motion.div>
      )}

      {/* Inactive Startup Notifications */}
      <div className="mt-8">
        <InactiveStartupNotifications onNavigate={onNavigate} />
      </div>

    </div>
  );
}
