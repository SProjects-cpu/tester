import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Check, X, Grid, List, History, Trash2, Search } from 'lucide-react';
import { startupApi, fmcApi } from '../utils/api';
import { exportFMCSchedulesToPDF, filterByDateRange, generateExportFileName } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import DateRangeFilter from './DateRangeFilter';
import GuestRestrictedButton from './GuestRestrictedButton';
import ConfirmationModal from './ConfirmationModal';

export default function FMCScheduling({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [allStartups, setAllStartups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showCompletionForm, setShowCompletionForm] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [showCompletedHistory, setShowCompletedHistory] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [startupSearchTerm, setStartupSearchTerm] = useState('');
  const [showStartupDropdown, setShowStartupDropdown] = useState(false);
  const startupSearchRef = useRef(null);
  const [completionData, setCompletionData] = useState({
    panelistName: '',
    time: '',
    feedback: ''
  });
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  const filteredSchedules = useMemo(() => {
    if (dateRange.fromDate || dateRange.toDate) {
      return filterByDateRange(schedules, 'date', dateRange.fromDate, dateRange.toDate);
    }
    return schedules;
  }, [schedules, dateRange]);

  // Filtered startups for search
  const filteredStartupsForSearch = useMemo(() => {
    let filtered = selectedStage ? startups.filter(s => s.stage === selectedStage) : startups;
    if (startupSearchTerm) {
      const searchLower = startupSearchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.companyName?.toLowerCase().includes(searchLower) ||
        s.founderName?.toLowerCase().includes(searchLower) ||
        s.magicCode?.toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [startups, selectedStage, startupSearchTerm]);

  // Handle startup selection
  const handleStartupSelect = (startup) => {
    setSelectedStartup(startup.id);
    setStartupSearchTerm(startup.companyName);
    setShowStartupDropdown(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (startupSearchRef.current && !startupSearchRef.current.contains(event.target)) {
        setShowStartupDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = useCallback((format) => {
    const fileName = generateExportFileName('FMC-Schedules', dateRange.fromDate, dateRange.toDate);
    
    if (format === 'pdf') {
      exportFMCSchedulesToPDF(filteredSchedules, startups, dateRange.fromDate, dateRange.toDate);
    } else {
      const headers = ['Date', 'Time Slot', 'Company', 'Status', 'Panelist', 'Feedback'];
      const rows = filteredSchedules.map(schedule => {
        const startup = startups.find(s => s.id === schedule.startupId);
        return [
          schedule.date || '',
          schedule.timeSlot || '',
          startup?.companyName || schedule.startup?.companyName || 'Unknown',
          schedule.status || '',
          schedule.completionData?.panelistName || '',
          schedule.completionData?.feedback || ''
        ];
      });
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    alert(`${filteredSchedules.length} FMC schedule(s) exported as ${format.toUpperCase()}!`);
  }, [filteredSchedules, startups, dateRange]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [startupsData, schedulesData] = await Promise.all([
        startupApi.getAll(),
        fmcApi.getAll()
      ]);
      setAllStartups(startupsData);
      const eligibleStartups = startupsData.filter(
        s => s.status === 'Active' && ['S0', 'S1', 'S2', 'S3'].includes(s.stage)
      );
      setStartups(eligibleStartups);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get Fridays instead of Saturdays (day 5 instead of 6)
  const fridays = useMemo(() => {
    const result = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day, 12, 0, 0);
      if (date.getDay() === 5) { // Friday = 5
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        result.push(dateStr);
      }
    }
    return result;
  }, [selectedMonth, selectedYear]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear; year <= 2060; year++) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  const monthNames = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);


  const handleSchedule = useCallback(async () => {
    if (!selectedDate || !selectedSlot || !selectedStartup) {
      alert('Please select date, time slot, and startup');
      return;
    }

    const existingSchedule = schedules.find(
      s => s.date === selectedDate && 
           s.timeSlot === selectedSlot && 
           s.status === 'Scheduled'
    );

    if (existingSchedule) {
      const bookedStartup = startups.find(s => s.id === existingSchedule.startupId);
      const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      alert(
        `⚠️ TIME SLOT ALREADY BOOKED!\n\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${selectedSlot}\n\n` +
        `Already scheduled for:\n` +
        `Company: ${bookedStartup?.companyName || 'Unknown'}\n` +
        `Magic Code: ${bookedStartup?.magicCode || 'N/A'}\n` +
        `Founder: ${bookedStartup?.founderName || 'N/A'}\n\n` +
        `Please select a different time slot.`
      );
      return;
    }

    const newSchedule = {
      id: Date.now().toString(),
      startupId: selectedStartup,
      date: selectedDate,
      timeSlot: selectedSlot,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    try {
      const created = await fmcApi.create(newSchedule);
      setSchedules(prev => [...prev, created]);
      setSelectedStartup(null);
      setSelectedSlot(null);
      alert('✅ FMC scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling FMC:', error);
      alert('❌ Failed to schedule FMC: ' + error.message);
    }
  }, [selectedDate, selectedSlot, selectedStartup, schedules, startups]);

  const handleComplete = useCallback((schedule) => {
    setShowCompletionForm(schedule);
    setCompletionData({ panelistName: '', time: '', feedback: '' });
  }, []);

  const handleNotDone = useCallback(async (schedule) => {
    if (confirm('Mark this meeting as "Not Done"? The meeting will remain in the schedule with "Not Done" status.')) {
      try {
        await fmcApi.update(schedule.id, {
          ...schedule,
          status: 'Not Done'
        });
        await loadData();
        alert('Meeting marked as "Not Done".');
      } catch (error) {
        console.error('Error updating schedule:', error);
        alert('❌ Failed to update schedule: ' + error.message);
      }
    }
  }, [loadData]);

  const handleDeleteSchedule = useCallback(async (schedule) => {
    const startup = startups.find(s => s.id === schedule.startupId) || allStartups.find(s => s.id === schedule.startupId);
    const companyName = startup?.companyName || 'Unknown Startup';
    
    if (confirm(`Delete this scheduled meeting for "${companyName}"? This action cannot be undone.`)) {
      try {
        await fmcApi.delete(schedule.id);
        setSchedules(schedules.filter(s => s.id !== schedule.id));
        alert('✅ Meeting deleted successfully.');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('❌ Failed to delete schedule: ' + error.message);
      }
    }
  }, [startups, allStartups, schedules]);

  const submitCompletion = useCallback(() => {
    if (!completionData.panelistName || !completionData.time || !completionData.feedback) {
      alert('Please fill all fields');
      return;
    }

    const schedule = showCompletionForm;
    const startup = startups.find(s => s.id === schedule.startupId);
    
    if (!startup) return;

    const stageAtCompletion = startup.stage;

    let newStage = startup.stage;
    if (startup.stage === 'S0') newStage = 'S1';
    else if (startup.stage === 'S1') newStage = 'S2';
    else if (startup.stage === 'S2') newStage = 'S3';

    const stageChanged = newStage !== startup.stage;
    const confirmMessage = stageChanged
      ? `Are you sure you want to move "${startup.companyName}" from ${startup.stage} to ${newStage}? This action will update the startup's stage and add this pitch to their history.`
      : `Mark FMC session as completed for "${startup.companyName}" at stage ${startup.stage}? The startup will remain at ${startup.stage}.`;

    setConfirmationModal({
      isOpen: true,
      title: stageChanged ? 'Confirm Stage Change' : 'Confirm Completion',
      message: confirmMessage,
      type: 'info',
      onConfirm: async () => {
        try {
          closeConfirmationModal();
          
          if (stageChanged) {
            await startupApi.update(startup.id, { stage: newStage });
          }

          await fmcApi.update(schedule.id, {
            ...schedule,
            status: 'Completed',
            completionData: {
              ...completionData,
              stageAtCompletion
            }
          });

          setShowCompletionForm(null);
          await loadData();
          
          const successMessage = stageChanged 
            ? 'FMC marked as completed and startup stage updated!'
            : 'FMC marked as completed!';
          alert(successMessage);
        } catch (error) {
          console.error('Error completing FMC:', error);
          alert('❌ Failed to complete FMC: ' + error.message);
        }
      }
    });
  }, [completionData, showCompletionForm, startups, loadData]);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'warning'
    });
  }, []);

  const handleViewHistory = useCallback((schedule) => {
    const startup = startups.find(s => s.id === schedule.startupId) || 
                    allStartups.find(s => s.id === schedule.startupId) ||
                    (schedule.startup ? {
                      id: schedule.startup.id,
                      companyName: schedule.startup.companyName,
                      founderName: schedule.startup.founderName,
                      isPartialData: true
                    } : null);
    setShowHistoryModal({ schedule, startup });
  }, [startups, allStartups]);

  const displayFridays = useMemo(() => {
    if (!dateRange.fromDate && !dateRange.toDate) {
      return fridays;
    }
    
    return fridays.filter(dateStr => {
      const date = new Date(dateStr);
      
      if (dateRange.fromDate) {
        const from = new Date(dateRange.fromDate);
        from.setHours(0, 0, 0, 0);
        if (date < from) return false;
      }
      
      if (dateRange.toDate) {
        const to = new Date(dateRange.toDate);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }
      
      return true;
    });
  }, [fridays, dateRange]);


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 max-w-7xl mx-auto pl-16 lg:pl-0">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold magic-text-gradient">
            FMC Scheduling
          </h1>
          <p className="text-white mt-2 text-sm sm:text-base">
            Friday Mentorship Clinic - Schedule and manage pitch sessions ({filteredSchedules.length} schedules)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <DateRangeFilter 
            variant="inline"
            onDateRangeChange={setDateRange}
          />
          <button
            onClick={() => setShowCompletedHistory(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            title="View completed sessions history"
          >
            <History className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">History</span>
          </button>
          <ExportMenu 
            onExport={handleExport}
            title="Export"
            formats={['pdf', 'csv']}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
        {/* Scheduling Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-4">
            Schedule New FMC
          </h2>

          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    setSelectedDate(null);
                  }}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setSelectedDate(null);
                  }}
                  className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Select Friday
              </label>
              <select
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
              >
                <option value="">Choose Friday...</option>
                {fridays.length > 0 ? (
                  fridays.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        day: 'numeric',
                        month: 'long'
                      })}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No Fridays in {monthNames[selectedMonth]} {selectedYear}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Enter Time
              </label>
              <input
                type="time"
                value={selectedSlot || ''}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
                placeholder="Select time"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Choose Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => {
                  setSelectedStage(e.target.value);
                  setSelectedStartup(null);
                }}
                className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
              >
                <option value="">All Stages</option>
                <option value="S0">S0</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Select Startup
              </label>
              <div className="relative" ref={startupSearchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={startupSearchTerm}
                    onChange={(e) => {
                      setStartupSearchTerm(e.target.value);
                      setShowStartupDropdown(true);
                      if (!e.target.value) setSelectedStartup(null);
                    }}
                    onFocus={() => setShowStartupDropdown(true)}
                    placeholder="Search by name, founder, or code..."
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
                  />
                  {selectedStartup && (
                    <button
                      onClick={() => {
                        setSelectedStartup(null);
                        setStartupSearchTerm('');
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {showStartupDropdown && filteredStartupsForSearch.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredStartupsForSearch.map(startup => (
                      <button
                        key={startup.id}
                        onClick={() => handleStartupSelect(startup)}
                        className={`w-full px-4 py-2 text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${
                          selectedStartup === startup.id ? 'bg-green-100 dark:bg-green-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{startup.companyName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{startup.founderName} • {startup.magicCode}</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            startup.stage === 'S0' ? 'bg-gray-100 text-gray-700' :
                            startup.stage === 'S1' ? 'bg-blue-100 text-blue-700' :
                            startup.stage === 'S2' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {startup.stage}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showStartupDropdown && startupSearchTerm && filteredStartupsForSearch.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-lg p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No startups found
                  </div>
                )}
              </div>
            </div>

            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={handleSchedule}
              actionType="schedule"
              className="w-full flex items-center justify-center space-x-2 magic-gradient text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              <span>Schedule FMC</span>
            </GuestRestrictedButton>
          </div>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl text-gray-900 dark:text-gray-100">
                {monthNames[selectedMonth]} {selectedYear} - Fridays
              </h2>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {displayFridays.length} Friday{displayFridays.length !== 1 ? 's' : ''}
                {(dateRange.fromDate || dateRange.toDate) && displayFridays.length !== fridays.length && 
                  ` (filtered from ${fridays.length})`
                }
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>


          {displayFridays.length > 0 ? (
            <div className="space-y-6">
              {displayFridays.map(date => {
                const daySchedules = schedules
                  .filter(s => s.date === date)
                  .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

                return (
                  <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span className="font-semibold">
                          {new Date(date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="ml-auto text-sm bg-white/20 px-3 py-1 rounded-full">
                          {daySchedules.length} meeting{daySchedules.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                        {daySchedules.map(schedule => {
                          const startup = startups.find(s => s.id === schedule.startupId);
                          const allStartup = allStartups.find(s => s.id === schedule.startupId);
                          const displayStartup = startup || allStartup;
                          const isCompleted = schedule.status === 'Completed';
                          const isNotDone = schedule.status === 'Not Done';
                          const isUnknown = !displayStartup;

                          return (
                            <motion.div
                              key={schedule.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`p-4 rounded-xl border-2 ${
                                isUnknown
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                  : isCompleted
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : isNotDone
                                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                      : 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                              } shadow-sm hover:shadow-md transition-all`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                                    {schedule.timeSlot}
                                  </span>
                                  {displayStartup?.stage && (
                                    <span className={`px-2 py-0.5 text-white text-xs font-bold rounded-full ${
                                      displayStartup.stage === 'S0' ? 'bg-blue-500' :
                                      displayStartup.stage === 'S1' ? 'bg-indigo-500' :
                                      displayStartup.stage === 'S2' ? 'bg-purple-500' :
                                      displayStartup.stage === 'S3' ? 'bg-pink-500' : 'bg-gray-500'
                                    }`}>
                                      {schedule.completionData?.stageAtCompletion || displayStartup.stage}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {isCompleted && (
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                      ✓ Done
                                    </span>
                                  )}
                                  {isNotDone && (
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                      ✗ Not Done
                                    </span>
                                  )}
                                  {isUnknown && (
                                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                                      ⚠ Unknown
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                                {displayStartup?.companyName || 'Unknown Startup'}
                              </p>

                              {isCompleted ? (
                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleViewHistory(schedule)}
                                    className="flex-1 flex items-center justify-center space-x-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors"
                                  >
                                    <span>View Details</span>
                                  </motion.button>
                                  <GuestRestrictedButton
                                    isGuest={isGuest}
                                    onClick={() => handleDeleteSchedule(schedule)}
                                    actionType="delete"
                                    className="flex items-center justify-center bg-red-500 text-white px-2 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                                    title="Delete meeting"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </GuestRestrictedButton>
                                </div>
                              ) : isNotDone ? (
                                <div className="space-y-2">
                                  {!isUnknown && (
                                    <GuestRestrictedButton
                                      isGuest={isGuest}
                                      onClick={() => handleComplete(schedule)}
                                      actionType="feedback"
                                      className="w-full flex items-center justify-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Mark Done</span>
                                    </GuestRestrictedButton>
                                  )}
                                  <GuestRestrictedButton
                                    isGuest={isGuest}
                                    onClick={() => handleDeleteSchedule(schedule)}
                                    actionType="delete"
                                    className="w-full flex items-center justify-center space-x-1 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Delete</span>
                                  </GuestRestrictedButton>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {!isUnknown && (
                                    <GuestRestrictedButton
                                      isGuest={isGuest}
                                      onClick={() => handleComplete(schedule)}
                                      actionType="feedback"
                                      className="w-full flex items-center justify-center space-x-1 bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Mark Done</span>
                                    </GuestRestrictedButton>
                                  )}
                                  <div className="flex gap-2">
                                    <GuestRestrictedButton
                                      isGuest={isGuest}
                                      onClick={() => handleNotDone(schedule)}
                                      actionType="delete"
                                      className="flex-1 flex items-center justify-center space-x-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Not Done</span>
                                    </GuestRestrictedButton>
                                    <GuestRestrictedButton
                                      isGuest={isGuest}
                                      onClick={() => handleDeleteSchedule(schedule)}
                                      actionType="delete"
                                      className="flex items-center justify-center bg-gray-500 text-white px-2 py-2 rounded-lg text-xs font-semibold hover:bg-gray-600 transition-colors"
                                      title="Delete meeting"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </GuestRestrictedButton>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'list' && (
                      <div className="space-y-2 p-4">
                        {daySchedules.map(schedule => {
                          const startup = startups.find(s => s.id === schedule.startupId);
                          const allStartup = allStartups.find(s => s.id === schedule.startupId);
                          const displayStartup = startup || allStartup;
                          const isCompleted = schedule.status === 'Completed';
                          const isNotDone = schedule.status === 'Not Done';
                          const isUnknown = !displayStartup;

                          return (
                            <motion.div
                              key={schedule.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 rounded-xl border-2 ${
                                isUnknown
                                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                  : isCompleted
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                    : isNotDone
                                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                      : 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                              } shadow-sm hover:shadow-md transition-all`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center space-x-4 flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 flex-shrink-0">
                                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <span className="font-bold text-base text-gray-900 dark:text-white">
                                      {schedule.timeSlot}
                                    </span>
                                    {displayStartup?.stage && (
                                      <span className={`px-2 py-0.5 text-white text-xs font-bold rounded-full ${
                                        displayStartup.stage === 'S0' ? 'bg-blue-500' :
                                        displayStartup.stage === 'S1' ? 'bg-indigo-500' :
                                        displayStartup.stage === 'S2' ? 'bg-purple-500' :
                                        displayStartup.stage === 'S3' ? 'bg-pink-500' : 'bg-gray-500'
                                      }`}>
                                        {schedule.completionData?.stageAtCompletion || displayStartup.stage}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                      {displayStartup?.companyName || 'Unknown Startup'}
                                    </p>
                                    {displayStartup && (
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {displayStartup.founderName} • {displayStartup.city}
                                      </p>
                                    )}
                                  </div>
                                  {isCompleted && (
                                    <span className="flex-shrink-0 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                      ✓ Completed
                                    </span>
                                  )}
                                  {isNotDone && (
                                    <span className="flex-shrink-0 px-3 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
                                      ✗ Not Done
                                    </span>
                                  )}
                                  {isUnknown && (
                                    <span className="flex-shrink-0 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                                      ⚠ Unknown
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {isCompleted ? (
                                    <>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleViewHistory(schedule)}
                                        className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                                      >
                                        <span>View Details</span>
                                      </motion.button>
                                      <GuestRestrictedButton
                                        isGuest={isGuest}
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        actionType="delete"
                                        className="flex items-center justify-center bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                                        title="Delete meeting"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </GuestRestrictedButton>
                                    </>
                                  ) : isNotDone ? (
                                    <>
                                      {!isUnknown && (
                                        <GuestRestrictedButton
                                          isGuest={isGuest}
                                          onClick={() => handleComplete(schedule)}
                                          actionType="feedback"
                                          className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                                        >
                                          <Check className="w-4 h-4" />
                                          <span>Mark Done</span>
                                        </GuestRestrictedButton>
                                      )}
                                      <GuestRestrictedButton
                                        isGuest={isGuest}
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        actionType="delete"
                                        className="flex items-center space-x-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                      </GuestRestrictedButton>
                                    </>
                                  ) : (
                                    <>
                                      {!isUnknown && (
                                        <GuestRestrictedButton
                                          isGuest={isGuest}
                                          onClick={() => handleComplete(schedule)}
                                          actionType="feedback"
                                          className="flex items-center space-x-1 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                                        >
                                          <Check className="w-4 h-4" />
                                          <span>Mark Done</span>
                                        </GuestRestrictedButton>
                                      )}
                                      <GuestRestrictedButton
                                        isGuest={isGuest}
                                        onClick={() => handleNotDone(schedule)}
                                        actionType="delete"
                                        className="flex items-center space-x-1 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                        <span>Not Done</span>
                                      </GuestRestrictedButton>
                                      <GuestRestrictedButton
                                        isGuest={isGuest}
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        actionType="delete"
                                        className="flex items-center justify-center bg-gray-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
                                        title="Delete meeting"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </GuestRestrictedButton>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {daySchedules.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No meetings scheduled for this day
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {dateRange.fromDate || dateRange.toDate 
                  ? 'No Fridays match the selected date range'
                  : `No Fridays in ${monthNames[selectedMonth]} ${selectedYear}`
                }
              </p>
            </div>
          )}
        </div>
      </div>


      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold magic-text-gradient">
                  FMC Session History
                </h3>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {showHistoryModal.startup ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                      Startup Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Company:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showHistoryModal.startup.companyName}
                        </p>
                      </div>
                      {showHistoryModal.startup.magicCode && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Magic Code:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {showHistoryModal.startup.magicCode}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Founder:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showHistoryModal.startup.founderName}
                        </p>
                      </div>
                      {!showHistoryModal.startup.isPartialData && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Current Stage/Status:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              showHistoryModal.startup.status === 'Onboarded' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              showHistoryModal.startup.status === 'Graduated' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              showHistoryModal.startup.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              showHistoryModal.startup.stage === 'One-on-One' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {showHistoryModal.startup.status === 'Active' ? showHistoryModal.startup.stage : showHistoryModal.startup.status}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                      FMC Session Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Date:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(showHistoryModal.schedule.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Time Slot:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {showHistoryModal.schedule.timeSlot}
                        </p>
                      </div>
                      {showHistoryModal.schedule.completionData && (
                        <>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Actual Time:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {showHistoryModal.schedule.completionData.time}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Panelist:</span>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {showHistoryModal.schedule.completionData.panelistName}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Feedback:</span>
                            <p className="font-medium text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                              {showHistoryModal.schedule.completionData.feedback}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pitch History */}
                  {showHistoryModal.startup.pitchHistory && showHistoryModal.startup.pitchHistory.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                        All Pitch History
                      </h4>
                      <div className="space-y-3">
                        {showHistoryModal.startup.pitchHistory.map((pitch, index) => (
                          <div key={index} className="bg-white dark:bg-gray-700 rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Pitch {index + 1} - {pitch.stage}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(pitch.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Panelist:</span> {pitch.panelistName}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Time:</span> {pitch.time}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Feedback:</span> {pitch.feedback}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Startup information not found
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowHistoryModal(null)}
                  className="px-6 py-2.5 magic-gradient text-white rounded-xl font-semibold shadow-magic hover:shadow-magic-lg transition-all"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Completion Form Modal */}
        {showCompletionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCompletionForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Complete FMC Session
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Panelist Name
                  </label>
                  <input
                    type="text"
                    value={completionData.panelistName}
                    onChange={(e) => setCompletionData({ ...completionData, panelistName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Enter panelist name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={completionData.time}
                    onChange={(e) => setCompletionData({ ...completionData, time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={completionData.feedback}
                    onChange={(e) => setCompletionData({ ...completionData, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="Enter feedback..."
                  />
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCompletionForm(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={submitCompletion}
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Complete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Completed Sessions History Modal */}
        {showCompletedHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCompletedHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold magic-text-gradient">
                  Completed FMC Sessions
                </h3>
                <button
                  onClick={() => setShowCompletedHistory(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {schedules.filter(s => s.status === 'Completed').length > 0 ? (
                <div className="space-y-4">
                  {schedules
                    .filter(s => s.status === 'Completed')
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(session => {
                      const startup = allStartups.find(s => s.id === session.startupId);
                      return (
                        <div
                          key={session.id}
                          className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">
                                {startup?.companyName || 'Unknown Startup'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {startup?.founderName} • {startup?.sector}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {session.completionData?.stageAtCompletion && (
                                <span className={`px-2 py-1 text-white text-xs font-semibold rounded-full ${
                                  session.completionData.stageAtCompletion === 'S0' ? 'bg-blue-500' :
                                  session.completionData.stageAtCompletion === 'S1' ? 'bg-indigo-500' :
                                  session.completionData.stageAtCompletion === 'S2' ? 'bg-purple-500' :
                                  session.completionData.stageAtCompletion === 'S3' ? 'bg-pink-500' : 'bg-gray-500'
                                }`}>
                                  {session.completionData.stageAtCompletion}
                                </span>
                              )}
                              <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                ✓ Completed
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Date:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(session.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Time:</span>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {session.timeSlot}
                              </p>
                            </div>
                            {session.completionData?.panelistName && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Panelist:</span>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {session.completionData.panelistName}
                                </p>
                              </div>
                            )}
                          </div>
                          {session.completionData?.feedback && (
                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Feedback:</span>
                              <p className="text-sm text-gray-900 dark:text-white mt-1">
                                {session.completionData.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    No completed sessions yet
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCompletedHistory(false)}
                  className="px-6 py-2.5 magic-gradient text-white rounded-xl font-semibold shadow-magic hover:shadow-magic-lg transition-all"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          confirmText="Yes"
          cancelText="No"
        />
      </AnimatePresence>
    </div>
  );
}
