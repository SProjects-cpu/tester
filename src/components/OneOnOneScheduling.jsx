import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Check, X, Users, CheckCircle, XCircle, Grid, List } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportOneOnOneSessionsToPDF } from '../utils/exportUtils';
import { exportOneOnOneSessions } from '../utils/storage';
import ExportMenu from './ExportMenu';
import GuestRestrictedButton from './GuestRestrictedButton';
import RejectionModal from './RejectionModal';
import OnboardingModal from './OnboardingModal';

export default function OneOnOneScheduling({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showCompletionForm, setShowCompletionForm] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [completionData, setCompletionData] = useState({
    mentorName: '',
    feedback: '',
    progress: ''
  });

  const handleExport = (format) => {
    if (format === 'pdf') {
      exportOneOnOneSessionsToPDF();
    } else if (format === 'json') {
      exportOneOnOneSessions();
    } else {
      // CSV export
      const headers = ['Date', 'Time', 'Company', 'Magic Code', 'Status', 'Mentor', 'Progress', 'Feedback'];
      const rows = schedules.map(schedule => {
        const startup = startups.find(s => s.id === schedule.startupId);
        return [
          schedule.date || '',
          schedule.time || '',
          startup?.companyName || 'Unknown',
          startup?.magicCode || '',
          schedule.status || '',
          schedule.completionData?.mentorName || '',
          schedule.completionData?.progress || '',
          schedule.completionData?.feedback || ''
        ];
      });
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MAGIC-OneOnOne-Sessions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    alert(`One-on-One sessions exported as ${format.toUpperCase()}!`);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const startupsData = storage.get('startups', []).filter(
      s => s.stage === 'One-on-One' && s.status === 'Active'
    );
    setStartups(startupsData);
    setSchedules(storage.get('oneOnOneSchedules', []));
  };

  const getWeekdays = (month, year) => {
    const weekdays = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day, 12, 0, 0);
      const dayOfWeek = date.getDay();
      // Weekdays and Saturday (Monday to Saturday: 1-6)
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        weekdays.push(dateStr);
      }
    }
    return weekdays;
  };

  const getYearOptions = () => {
    const years = [];
    for (let year = currentYear; year <= 2060; year++) {
      years.push(year);
    }
    return years;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSchedule = () => {
    if (!selectedDate || !selectedTime || !selectedStartup) {
      alert('Please select date, time, and startup');
      return;
    }

    const newSchedule = {
      id: Date.now().toString(),
      startupId: selectedStartup,
      date: selectedDate,
      time: selectedTime,
      status: 'Scheduled',
      createdAt: new Date().toISOString()
    };

    const updated = [...schedules, newSchedule];
    storage.set('oneOnOneSchedules', updated);
    setSchedules(updated);
    setSelectedStartup(null);
    setSelectedDate('');
    setSelectedTime('');
    alert('One-on-One meeting scheduled successfully!');
  };

  const handleComplete = (schedule) => {
    setShowCompletionForm(schedule);
    setCompletionData({ mentorName: '', feedback: '', progress: '' });
  };

  const submitCompletion = () => {
    if (!completionData.mentorName || !completionData.feedback) {
      alert('Please fill mentor name and feedback');
      return;
    }

    const schedule = showCompletionForm;
    const startup = startups.find(s => s.id === schedule.startupId);
    
    if (!startup) return;

    // Add to one-on-one history
    const oneOnOneHistory = startup.oneOnOneHistory || [];
    oneOnOneHistory.push({
      date: schedule.date,
      time: schedule.time,
      mentorName: completionData.mentorName,
      feedback: completionData.feedback,
      progress: completionData.progress,
      completedAt: new Date().toISOString()
    });

    // Update startup
    const allStartups = storage.get('startups', []);
    const updatedStartups = allStartups.map(s => 
      s.id === startup.id 
        ? { ...s, oneOnOneHistory, lastMeetingDate: schedule.date }
        : s
    );
    storage.set('startups', updatedStartups);

    // Mark schedule as completed
    const updatedSchedules = schedules.map(s =>
      s.id === schedule.id
        ? { ...s, status: 'Completed', completionData }
        : s
    );
    storage.set('oneOnOneSchedules', updatedSchedules);

    setSchedules(updatedSchedules);
    setShowCompletionForm(null);
    loadData();
    alert('Meeting marked as completed!');
  };

  const handleCancelSchedule = (schedule) => {
    if (!confirm('Are you sure you want to cancel this scheduled meeting?')) {
      return;
    }

    // Remove the schedule
    const updatedSchedules = schedules.filter(s => s.id !== schedule.id);
    storage.set('oneOnOneSchedules', updatedSchedules);
    setSchedules(updatedSchedules);
    alert('Meeting cancelled successfully!');
  };

  const handleOnboard = (startup) => {
    setShowOnboardingModal(startup);
  };

  const confirmOnboard = (onboardingData) => {
    const startup = showOnboardingModal;
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s =>
      s.id === startup.id ? { 
        ...s, 
        status: 'Onboarded', 
        onboardingDescription: onboardingData.description,
        agreementDate: onboardingData.agreementDate,
        engagementMedium: onboardingData.engagementMedium,
        onboardedDate: onboardingData.onboardedDate
      } : s
    );
    storage.set('startups', updated);
    setShowOnboardingModal(null);
    loadData();
    alert(`${startup.companyName} has been onboarded successfully!`);
  };

  const handleReject = (startup, rejectionRemark) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s =>
      s.id === startup.id ? { 
        ...s, 
        status: 'Rejected',
        rejectionRemark,
        rejectedDate: new Date().toISOString(),
        rejectedFromStage: 'One-on-One'
      } : s
    );
    storage.set('startups', updated);
    setShowRejectionModal(null);
    loadData();
    alert(`${startup.companyName} has been rejected.`);
  };

  const getSchedulesForStartup = (startupId) => {
    return schedules.filter(s => s.startupId === startupId);
  };

  const getUpcomingSchedule = (startupId) => {
    return schedules.find(s => s.startupId === startupId && s.status === 'Scheduled');
  };

  const weekdays = getWeekdays(selectedMonth, selectedYear);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            One-on-One Scheduling
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
            Schedule and manage one-on-one mentorship meetings ({schedules.length} sessions)
          </p>
        </div>
        <ExportMenu 
          onExport={handleExport}
          title="Export"
          formats={['pdf', 'json', 'csv']}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Scheduling Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Schedule New Meeting
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {/* Month and Year Filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    setSelectedDate('');
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
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
                    setSelectedDate('');
                  }}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Select Date
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Choose date...</option>
                {weekdays.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Enter Time
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2">
                Select Startup
              </label>
              <select
                value={selectedStartup || ''}
                onChange={(e) => setSelectedStartup(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">Choose startup...</option>
                {startups.map(startup => (
                  <option key={startup.id} value={startup.id}>
                    {startup.companyName}
                  </option>
                ))}
              </select>
            </div>

            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={handleSchedule}
              actionType="schedule"
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Schedule Meeting</span>
            </GuestRestrictedButton>
          </div>
        </div>

        {/* Startups in One-on-One */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Startups in One-on-One ({startups.length})
            </h2>
            {/* View Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
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
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {startups.length > 0 ? (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {startups.map(startup => {
                    const startupSchedules = getSchedulesForStartup(startup.id);
                    const upcomingSchedule = getUpcomingSchedule(startup.id);
                    const completedMeetings = startupSchedules.filter(s => s.status === 'Completed');

                    return (
                      <motion.div
                        key={startup.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                          <h3 className="text-lg font-bold truncate">{startup.companyName}</h3>
                          <p className="text-white/90 text-sm truncate">Founder: {startup.founderName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-white/80 text-xs">{startup.city} • {startup.sector}</p>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
                              {completedMeetings.length} Done
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-3">
                          {/* Upcoming Meeting */}
                          {upcomingSchedule && (
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-700">
                              <div className="flex items-center space-x-2 mb-2">
                                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">
                                  Upcoming
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                                {new Date(upcomingSchedule.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })} at {upcomingSchedule.time}
                              </p>
                              <div className="flex gap-2">
                                <GuestRestrictedButton
                                  isGuest={isGuest}
                                  onClick={() => handleComplete(upcomingSchedule)}
                                  actionType="feedback"
                                  className="flex-1 flex items-center justify-center space-x-1 bg-green-500 text-white px-2 py-1.5 rounded text-xs font-semibold hover:bg-green-600 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Done</span>
                                </GuestRestrictedButton>
                                <GuestRestrictedButton
                                  isGuest={isGuest}
                                  onClick={() => handleCancelSchedule(upcomingSchedule)}
                                  actionType="delete"
                                  className="flex items-center justify-center bg-red-500 text-white px-2 py-1.5 rounded text-xs font-semibold hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </GuestRestrictedButton>
                              </div>
                            </div>
                          )}

                          {/* Meeting History */}
                          {completedMeetings.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-2">
                                Recent Meetings
                              </h4>
                              <div className="space-y-1">
                                {completedMeetings.slice(-2).map((meeting) => (
                                  <div key={meeting.id} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-green-800 dark:text-green-200 truncate">
                                        {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <GuestRestrictedButton
                              isGuest={isGuest}
                              onClick={() => handleOnboard(startup)}
                              actionType="onboard"
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-xs hover:bg-green-600 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Onboard</span>
                            </GuestRestrictedButton>
                            <GuestRestrictedButton
                              isGuest={isGuest}
                              onClick={() => setShowRejectionModal(startup)}
                              actionType="reject"
                              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg font-semibold text-xs hover:bg-red-600 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </GuestRestrictedButton>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {startups.map(startup => {
                    const startupSchedules = getSchedulesForStartup(startup.id);
                    const upcomingSchedule = getUpcomingSchedule(startup.id);
                    const completedMeetings = startupSchedules.filter(s => s.status === 'Completed');

                    return (
                      <motion.div
                        key={startup.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                      >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold">{startup.companyName}</h3>
                              <p className="text-white/90 text-sm">Founder: {startup.founderName}</p>
                              <p className="text-white/80 text-xs">{startup.city} • {startup.sector}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                                {completedMeetings.length} Meeting{completedMeetings.length !== 1 ? 's' : ''} Done
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                          {/* Upcoming Meeting */}
                          {upcomingSchedule && (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center space-x-2">
                                  <Calendar className="w-5 h-5" />
                                  <span>Upcoming Meeting</span>
                                </h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(upcomingSchedule.date).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {upcomingSchedule.time}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <GuestRestrictedButton
                                  isGuest={isGuest}
                                  onClick={() => handleComplete(upcomingSchedule)}
                                  actionType="feedback"
                                  className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Mark as Completed</span>
                                </GuestRestrictedButton>
                                <GuestRestrictedButton
                                  isGuest={isGuest}
                                  onClick={() => handleCancelSchedule(upcomingSchedule)}
                                  actionType="delete"
                                  className="flex items-center justify-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Not Done</span>
                                </GuestRestrictedButton>
                              </div>
                            </div>
                          )}

                          {/* Meeting History */}
                          {completedMeetings.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                Meeting History
                              </h4>
                              {completedMeetings.slice(-3).map((meeting) => (
                                <div key={meeting.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-green-800 dark:text-green-200">
                                      {new Date(meeting.date).toLocaleDateString()} - {meeting.time}
                                    </span>
                                    <span className="text-xs text-green-600 dark:text-green-400">✓ Completed</span>
                                  </div>
                                  {meeting.completionData && (
                                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                                      Mentor: {meeting.completionData.mentorName}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <GuestRestrictedButton
                              isGuest={isGuest}
                              onClick={() => handleOnboard(startup)}
                              actionType="onboard"
                              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Onboard</span>
                            </GuestRestrictedButton>
                            <GuestRestrictedButton
                              isGuest={isGuest}
                              onClick={() => setShowRejectionModal(startup)}
                              actionType="reject"
                              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </GuestRestrictedButton>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No startups in One-on-One stage
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Move startups to One-on-One from the All Startups page
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Completion Form Modal */}
        {showCompletionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCompletionForm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Complete Meeting & Add Feedback
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mentor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={completionData.mentorName}
                    onChange={(e) => setCompletionData({ ...completionData, mentorName: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter mentor name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feedback <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={completionData.feedback}
                    onChange={(e) => setCompletionData({ ...completionData, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter feedback from the meeting..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Progress Notes (Optional)
                  </label>
                  <textarea
                    value={completionData.progress}
                    onChange={(e) => setCompletionData({ ...completionData, progress: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Any progress notes..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCompletionForm(null)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitCompletion}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Save Feedback
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <RejectionModal
            startup={showRejectionModal}
            onClose={() => setShowRejectionModal(null)}
            onConfirm={(remark) => handleReject(showRejectionModal, remark)}
          />
        )}

        {/* Onboarding Modal */}
        {showOnboardingModal && (
          <OnboardingModal
            startup={showOnboardingModal}
            onClose={() => setShowOnboardingModal(null)}
            onConfirm={confirmOnboard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
