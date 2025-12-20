import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

export default function DateRangeFilter({ onDateRangeChange, className = '' }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Filter by Date (DD-MM-YYYY)</span>
        </div>
        {(fromDate || toDate) && (
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
