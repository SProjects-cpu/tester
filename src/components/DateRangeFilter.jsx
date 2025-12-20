import { useState, useEffect } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DateRangeFilter({ 
  onDateRangeChange, 
  className = '',
  variant = 'default', // 'default' | 'inline' | 'compact'
  initialFromDate = '',
  initialToDate = ''
}) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setFromDate(initialFromDate);
    setToDate(initialToDate);
  }, [initialFromDate, initialToDate]);

  const formatDateDisplay = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleFromDateChange = (e) => {
    const value = e.target.value;
    setFromDate(value);
    validateAndNotify(value, toDate);
  };

  const handleToDateChange = (e) => {
    const value = e.target.value;
    setToDate(value);
    validateAndNotify(fromDate, value);
  };

  const validateAndNotify = (from, to) => {
    if (from && to && new Date(from) > new Date(to)) {
      setError('From date cannot be after To date');
      return;
    }
    setError('');
    onDateRangeChange?.({ fromDate: from || null, toDate: to || null });
  };

  const clearDates = () => {
    setFromDate('');
    setToDate('');
    setError('');
    onDateRangeChange?.({ fromDate: null, toDate: null });
  };

  const hasDateFilter = fromDate || toDate;

  // Inline variant - collapsible button that expands to show date inputs
  if (variant === 'inline') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center space-x-2 px-4 py-3 border-2 rounded-xl transition-all text-sm sm:text-base ${
            hasDateFilter 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="hidden sm:inline">
            {hasDateFilter 
              ? `${formatDateDisplay(fromDate) || 'Start'} - ${formatDateDisplay(toDate) || 'End'}`
              : 'Date Filter'
            }
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 min-w-[280px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Date</span>
                {hasDateFilter && (
                  <button onClick={clearDates} className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-600">
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={handleFromDateChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={handleToDateChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Format: DD-MM-YYYY</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Backdrop to close dropdown */}
        {isExpanded && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsExpanded(false)}
          />
        )}
      </div>
    );
  }

  // Compact variant - single row with smaller inputs
  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={fromDate}
          onChange={handleFromDateChange}
          placeholder="From"
          className="w-32 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        <span className="text-gray-400 text-xs">to</span>
        <input
          type="date"
          value={toDate}
          onChange={handleToDateChange}
          placeholder="To"
          className="w-32 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
        />
        {hasDateFilter && (
          <button onClick={clearDates} className="p-1 text-red-500 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Default variant - full width with labels
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Filter by Date (DD-MM-YYYY)</span>
        </div>
        {hasDateFilter && (
          <button onClick={clearDates} className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-600">
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
          {fromDate && <span className="text-xs text-purple-600 dark:text-purple-400 mt-1 block">{formatDateDisplay(fromDate)}</span>}
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
          {toDate && <span className="text-xs text-purple-600 dark:text-purple-400 mt-1 block">{formatDateDisplay(toDate)}</span>}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
