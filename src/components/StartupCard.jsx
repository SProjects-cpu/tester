import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Edit, Trash2, CheckCircle, XCircle, Users, Calendar, Upload, TrendingUp, Award, Lock } from 'lucide-react';
import EditStartupProfile from './EditStartupProfile';
import GuestRestrictedButton from './GuestRestrictedButton';
import RejectionModal from './RejectionModal';
import OnboardingModal from './OnboardingModal';
import AdminAuthModal from './AdminAuthModal';
import { getField } from '../utils/startupFieldHelper';

export default function StartupCard({ startup, onUpdate, onDelete, isGuest = false }) {
  const [expanded, setExpanded] = useState({
    startup: false,
    founder: false,
    registration: false,
    pitchHistory: false,
    oneOnOne: false,
    onboarded: false,
    rejection: false
  });
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
  const [showOneOnOneFeedback, setShowOneOnOneFeedback] = useState(false);
  const [showAchievementUpload, setShowAchievementUpload] = useState(false);
  
  const [meetingData, setMeetingData] = useState({ date: '', time: '' });
  const [feedbackData, setFeedbackData] = useState({ feedback: '', mentorName: '' });
  const [achievementData, setAchievementData] = useState({ achievement: '', revenue: '' });
  const [adminAuthModal, setAdminAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStageColor = (stage) => {
    const colors = {
      'S0': 'from-gray-400 to-gray-600',
      'S1': 'from-blue-400 to-blue-600',
      'S2': 'from-purple-400 to-purple-600',
      'S3': 'from-orange-400 to-orange-600',
      'One-on-One': 'from-indigo-400 to-indigo-600'
    };
    return colors[stage] || 'from-gray-400 to-gray-600';
  };

  const getStatusColor = (status) => {
    if (status === 'Onboarded') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const handleOnboard = () => {
    const companyName = getField(startup, 'companyName');
    setAdminAuthModal({
      isOpen: true,
      title: 'Onboard Startup',
      message: `You are about to onboard "${companyName}". This will change the startup status to Onboarded. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: () => {
        setShowOnboardingModal(true);
      }
    });
  };

  const confirmOnboard = (onboardingData) => {
    onUpdate({ 
      ...startup, 
      status: 'Onboarded', 
      onboardingDescription: onboardingData.description,
      agreementDate: onboardingData.agreementDate,
      engagementMedium: onboardingData.engagementMedium,
      onboardedDate: onboardingData.onboardedDate
    });
    setShowOnboardingModal(false);
  };

  const handleReject = (rejectionRemark) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Reject Startup',
      message: `You are about to reject "${startup.companyName}". This action will mark the startup as rejected and cannot be easily undone. Please authenticate to proceed.`,
      actionType: 'danger',
      onConfirm: () => {
        onUpdate({ 
          ...startup, 
          status: 'Rejected', 
          rejectionRemark,
          rejectedDate: new Date().toISOString(),
          rejectedFromStage: startup.stage
        });
        setShowRejectionModal(false);
        alert('✅ Startup rejected successfully!');
      }
    });
  };

  const handleOneOnOne = () => {
    const companyName = getField(startup, 'companyName');
    setAdminAuthModal({
      isOpen: true,
      title: 'Move to One-on-One',
      message: `You are about to move "${companyName}" to One-on-One mentorship stage. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: () => {
        onUpdate({ ...startup, stage: 'One-on-One' });
        alert('✅ Startup moved to One-on-One stage!');
      }
    });
  };

  const handleScheduleMeeting = () => {
    if (!meetingData.date || !meetingData.time) {
      alert('Please fill in all meeting details');
      return;
    }
    const oneOnOneHistory = startup.oneOnOneHistory || [];
    oneOnOneHistory.push({
      ...meetingData,
      scheduled: true,
      scheduledAt: new Date().toISOString()
    });
    onUpdate({ ...startup, oneOnOneHistory });
    setShowScheduleMeeting(false);
    setMeetingData({ date: '', time: '' });
    setShowOneOnOneFeedback(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackData.feedback || !feedbackData.mentorName) {
      alert('Please fill in all feedback details');
      return;
    }
    const oneOnOneHistory = startup.oneOnOneHistory || [];
    const lastSession = oneOnOneHistory[oneOnOneHistory.length - 1];
    if (lastSession) {
      lastSession.feedback = feedbackData.feedback;
      lastSession.mentorName = feedbackData.mentorName;
      lastSession.completed = true;
    }
    onUpdate({ ...startup, oneOnOneHistory, oneOnOneFeedbackCompleted: true });
    setShowOneOnOneFeedback(false);
    setFeedbackData({ feedback: '', mentorName: '' });
  };

  const handleGraduate = () => {
    const companyName = getField(startup, 'companyName');
    setAdminAuthModal({
      isOpen: true,
      title: 'Graduate Startup',
      message: `You are about to graduate "${companyName}". This will lock the startup and mark it as completed. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: () => {
        onUpdate({ ...startup, status: 'Graduated', graduatedDate: new Date().toISOString() });
        alert('✅ Startup graduated successfully!');
      }
    });
  };

  const handleUploadAchievement = () => {
    if (!achievementData.achievement) {
      alert('Please enter achievement details');
      return;
    }
    const achievements = startup.achievements || [];
    achievements.push({
      achievement: achievementData.achievement,
      revenue: achievementData.revenue,
      date: new Date().toISOString()
    });
    onUpdate({ ...startup, achievements });
    setShowAchievementUpload(false);
    setAchievementData({ achievement: '', revenue: '' });
  };

  const isLocked = startup.status === 'Graduated' || startup.status === 'Rejected';
  const isOnboarded = startup.status === 'Onboarded';
  const isGraduated = startup.status === 'Graduated';
  const isOneOnOne = startup.stage === 'One-on-One' && startup.status === 'Active';

  const Section = ({ title, section, children }) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm sm:text-base">{title}</span>
        {expanded[section] ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
        isLocked ? 'opacity-75' : ''
      }`}
    >
      <div className={`bg-gradient-to-r ${getStageColor(startup.stage)} p-4 sm:p-6 text-white`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            {/* Logo Display */}
            {getField(startup, 'logo') && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-white rounded-xl p-2 shadow-lg">
                <img 
                  src={getField(startup, 'logo')} 
                  alt={`${getField(startup, 'companyName')} logo`}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-xl sm:text-2xl font-bold truncate">{getField(startup, 'companyName')}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusColor(startup.status)}`}>
                  {startup.status}
                </span>
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {startup.stage}
                </span>
              </div>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="text-white/90 truncate">Magic Code: {getField(startup, 'magicCode')}</p>
                <p className="text-white/90 truncate">Founder: {getField(startup, 'founderName')}</p>
                <p className="text-white/80 text-xs sm:text-sm">{getField(startup, 'city')} • {getField(startup, 'sector')}</p>
              </div>
            </div>
          </div>
          {!isLocked && (
            <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
              <GuestRestrictedButton
                isGuest={isGuest}
                onClick={() => setShowEditProfile(true)}
                actionType="edit"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Edit Profile"
              >
                <Edit className="w-5 h-5" />
              </GuestRestrictedButton>
              <GuestRestrictedButton
                isGuest={isGuest}
                onClick={() => onDelete(startup.id)}
                actionType="delete"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Delete Startup"
              >
                <Trash2 className="w-5 h-5" />
              </GuestRestrictedButton>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Locked Status Banner */}
        {isLocked && (
          <div className="flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl">
            <Lock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                This startup is locked (View Only)
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: {startup.status} • No editing allowed
              </p>
            </div>
          </div>
        )}

        {/* S0 Stage Actions */}
        {startup.stage === 'S0' && !isLocked && (
          <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl">
            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={() => setShowRejectionModal(true)}
              actionType="reject"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reject Startup</span>
            </GuestRestrictedButton>
          </div>
        )}

        {/* S1, S2, S3 Stage Actions */}
        {['S1', 'S2', 'S3'].includes(startup.stage) && !isLocked && (
          <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={handleOnboard}
              actionType="onboard"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Onboard</span>
            </GuestRestrictedButton>
            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={handleOneOnOne}
              actionType="onboard"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>One-on-One</span>
            </GuestRestrictedButton>
            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={() => setShowRejectionModal(true)}
              actionType="reject"
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Reject</span>
            </GuestRestrictedButton>
          </div>
        )}

        {/* One-on-One Stage Actions */}
        {isOneOnOne && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>One-on-One Mentorship Stage</span>
              </h4>
              
              {!startup.oneOnOneFeedbackCompleted ? (
                <div className="space-y-3">
                  {!showScheduleMeeting && !showOneOnOneFeedback && (
                    <GuestRestrictedButton
                      isGuest={isGuest}
                      onClick={() => setShowScheduleMeeting(true)}
                      actionType="feedback"
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      <Calendar className="w-5 h-5" />
                      <span>Schedule Meeting</span>
                    </GuestRestrictedButton>
                  )}

                  {showScheduleMeeting && (
                    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <input
                        type="date"
                        value={meetingData.date}
                        onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <input
                        type="time"
                        value={meetingData.time}
                        onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleScheduleMeeting}
                          className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold"
                        >
                          Confirm Meeting
                        </button>
                        <button
                          onClick={() => setShowScheduleMeeting(false)}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {showOneOnOneFeedback && (
                    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <input
                        type="text"
                        placeholder="Mentor Name *"
                        value={feedbackData.mentorName}
                        onChange={(e) => setFeedbackData({ ...feedbackData, mentorName: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <textarea
                        placeholder="Feedback *"
                        value={feedbackData.feedback}
                        onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                      <button
                        onClick={handleSubmitFeedback}
                        className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg font-semibold"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <GuestRestrictedButton
                    isGuest={isGuest}
                    onClick={() => setShowRejectionModal(true)}
                    actionType="reject"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </GuestRestrictedButton>
                  <GuestRestrictedButton
                    isGuest={isGuest}
                    onClick={handleOnboard}
                    actionType="onboard"
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Onboard</span>
                  </GuestRestrictedButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onboarded Stage Actions */}
        {isOnboarded && !isGraduated && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border-2 border-green-200 dark:border-green-700">
              <h4 className="font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Onboarded - Track Progress</span>
              </h4>
              
              <div className="flex flex-wrap gap-2">
                <GuestRestrictedButton
                  isGuest={isGuest}
                  onClick={() => setShowAchievementUpload(true)}
                  actionType="edit"
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Achievement</span>
                </GuestRestrictedButton>
                <GuestRestrictedButton
                  isGuest={isGuest}
                  onClick={handleGraduate}
                  actionType="onboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  <Award className="w-5 h-5" />
                  <span>Graduate</span>
                </GuestRestrictedButton>
              </div>

              {showAchievementUpload && (
                <div className="mt-4 space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <textarea
                    placeholder="Achievement Details *"
                    value={achievementData.achievement}
                    onChange={(e) => setAchievementData({ ...achievementData, achievement: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Revenue Generated (₹)"
                    value={achievementData.revenue}
                    onChange={(e) => setAchievementData({ ...achievementData, revenue: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUploadAchievement}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold"
                    >
                      Save Achievement
                    </button>
                    <button
                      onClick={() => setShowAchievementUpload(false)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Section title="Startup Information" section="startup">
          {/* Logo and Office Photo Display */}
          {(getField(startup, 'logo') || getField(startup, 'officePhoto')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {getField(startup, 'logo') && (
                <div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block mb-2">Startup Logo</span>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <img
                      src={getField(startup, 'logo')}
                      alt={`${getField(startup, 'companyName')} Logo`}
                      className="max-h-32 mx-auto object-contain"
                    />
                  </div>
                </div>
              )}
              {getField(startup, 'officePhoto') && (
                <div>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block mb-2">Office Photo</span>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <img
                      src={getField(startup, 'officePhoto')}
                      alt={`${getField(startup, 'companyName')} Office`}
                      className="max-h-32 w-full object-cover rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Magic Code" value={getField(startup, 'magicCode')} />
            <Field label="Company Name" value={getField(startup, 'companyName')} />
            <Field label="City" value={getField(startup, 'city')} />
            <Field label="Sector" value={getField(startup, 'sector')} />
            <Field label="Stage of Idea" value={getField(startup, 'stageOfIdea')} />
            <Field label="Team Size" value={getField(startup, 'teamSize')} />
            <Field label="Has Patent" value={getField(startup, 'hasPatent')} />
            {getField(startup, 'hasPatent') === 'Yes' && <Field label="Patent Number" value={getField(startup, 'patentNumber')} />}
            <Field label="Is Registered" value={getField(startup, 'isRegistered')} />
            {getField(startup, 'isRegistered') === 'Yes' && <Field label="Registration Date" value={getField(startup, 'registrationDate')} />}
            <Field label="Website" value={getField(startup, 'website')} />
            <Field label="Social Media" value={getField(startup, 'socialMedia')} />
          </div>
          <Field label="Problem Solving" value={getField(startup, 'problemSolving')} />
          <Field label="Solution" value={getField(startup, 'solution')} />
        </Section>

        <Section title="Founder Information" section="founder">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Founder Name" value={getField(startup, 'founderName')} />
            <Field label="Age" value={getField(startup, 'founderAge')} />
            <Field label="Gender" value={getField(startup, 'founderGender')} />
            <Field label="College" value={getField(startup, 'college')} />
            <Field label="Email" value={getField(startup, 'founderEmail')} />
            <Field label="Mobile" value={getField(startup, 'founderMobile')} />
            <Field label="Referred From" value={getField(startup, 'referredFrom')} />
          </div>
          <Field label="Address" value={getField(startup, 'address')} />
        </Section>

        <Section title="Registration Info" section="registration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Session Number" value={startup.sessionNumber} />
            <Field label="Date" value={startup.date} />
            <Field label="Month" value={startup.month} />
            <Field label="Time Slot" value={startup.timeSlot} />
            <Field label="Registered Date" value={startup.registeredDate} />
            <Field label="Clinical Mentoring" value={startup.clinicalMentoring ? 'Yes' : 'No'} />
          </div>
          <Field label="Follow-Up Remark" value={startup.followUpRemark} />
        </Section>

        {startup.pitchHistory && startup.pitchHistory.length > 0 && (
          <Section title="Pitch History" section="pitchHistory">
            <div className="space-y-4">
              {startup.pitchHistory.map((pitch, index) => (
                <div key={index} className={`p-4 rounded-lg bg-gradient-to-r ${
                  pitch.stage === 'S1' ? 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' :
                  pitch.stage === 'S2' ? 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20' :
                  'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
                }`}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Pitch {index + 1} - {pitch.stage}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <Field label="Date" value={pitch.date} />
                    <Field label="Time" value={pitch.time} />
                    <Field label="Panelist" value={pitch.panelistName} />
                  </div>
                  <Field label="Feedback" value={pitch.feedback} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Show One-on-One section only for One-on-One stage or if history exists */}
        {(isOneOnOne || (startup.oneOnOneHistory && startup.oneOnOneHistory.length > 0)) && (
          <Section title="One-on-One Sessions" section="oneOnOne">
            <div className="space-y-4">
              {startup.oneOnOneHistory && startup.oneOnOneHistory.map((session, index) => (
                <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Session {index + 1}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <Field label="Date" value={session.date} />
                    <Field label="Time" value={session.time} />
                    {session.mentorName && <Field label="Mentor" value={session.mentorName} />}
                  </div>
                  {session.feedback && <Field label="Feedback" value={session.feedback} />}
                  {session.progress && <Field label="Progress" value={session.progress} />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Achievements Section - Only for Onboarded startups */}
        {isOnboarded && startup.achievements && startup.achievements.length > 0 && (
          <Section title="Achievements & Revenue" section="onboarded">
            <div className="space-y-4">
              {startup.achievements.map((achievement, index) => (
                <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Achievement {index + 1}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {achievement.achievement}
                      </p>
                      {achievement.revenue && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            Revenue:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            ₹{Number(achievement.revenue).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rejection Remarks Section */}
        {startup.status === 'Rejected' && startup.rejectionRemark && (
          <Section title="Rejection Details" section="rejection">
            <div className="p-4 rounded-lg bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-700">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                    Reason for Rejection
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {startup.rejectionRemark}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-3">
                    <div>
                      <span className="font-semibold">Rejected From:</span> {startup.rejectedFromStage || 'N/A'}
                    </div>
                    <div>
                      <span className="font-semibold">Date:</span> {startup.rejectedDate ? new Date(startup.rejectedDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditProfile && (
          <EditStartupProfile
            startup={startup}
            onClose={() => setShowEditProfile(false)}
            onUpdate={onUpdate}
          />
        )}
        {showRejectionModal && (
          <RejectionModal
            startup={startup}
            onClose={() => setShowRejectionModal(false)}
            onConfirm={handleReject}
          />
        )}
        {showOnboardingModal && (
          <OnboardingModal
            startup={startup}
            onClose={() => setShowOnboardingModal(false)}
            onConfirm={confirmOnboard}
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
    </motion.div>
  );
}
