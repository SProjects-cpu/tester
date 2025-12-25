import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, CheckCircle, XCircle, Users, Edit, GraduationCap, Lock, Download, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import EditStartupProfile from './EditStartupProfile';
import GuestRestrictedButton from './GuestRestrictedButton';
import RejectionModal from './RejectionModal';
import OnboardingModal from './OnboardingModal';
import GenerateReportButton from './GenerateReportButton';
import ConfirmationModal from './ConfirmationModal';
import DocumentList from './DocumentList';
import { getField } from '../utils/startupFieldHelper';
import { startupApi } from '../utils/api';

export default function StartupDetailModal({ startup, onClose, onUpdate, isGuest = false }) {
  const [expanded, setExpanded] = useState({
    startup: true,
    founder: true,
    registration: true,
    documents: true,
    pitchHistory: true,
    oneOnOne: true,
    onboarding: true,
    rejection: true,
    progressTracking: true
  });
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  if (!startup) return null;

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
    if (status === 'Graduated') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const handleOnboard = () => {
    setShowOnboardingModal(true);
  };

  const confirmOnboard = async (onboardingData) => {
    try {
      // Call API directly to save onboarding data to database
      await startupApi.update(startup.id, {
        stage: 'Onboarded',
        status: 'Onboarded',
        onboardingDescription: onboardingData.description,
        agreementDate: onboardingData.agreementDate,
        engagementMedium: onboardingData.engagementMedium,
        agreementCopy: onboardingData.agreementCopy,
        onboardedDate: onboardingData.onboardedDate
      });
      
      // Notify parent to refresh data
      onUpdate({ 
        ...startup, 
        stage: 'Onboarded',
        status: 'Onboarded',
        onboardingDescription: onboardingData.description,
        agreementDate: onboardingData.agreementDate,
        engagementMedium: onboardingData.engagementMedium,
        agreementCopy: onboardingData.agreementCopy,
        onboardedDate: onboardingData.onboardedDate
      });
      
      setShowOnboardingModal(false);
      onClose();
      alert(`✅ ${getField(startup, 'companyName')} has been onboarded successfully!`);
    } catch (error) {
      console.error('Error onboarding startup:', error);
      alert('❌ Failed to onboard startup: ' + error.message);
    }
  };

  const handleReject = async (rejectionRemark) => {
    try {
      // Call API directly to save rejection data to database
      await startupApi.update(startup.id, {
        stage: 'Rejected',
        status: 'Rejected',
        rejectionRemark,
        rejectedDate: new Date().toISOString(),
        rejectedFromStage: startup.stage
      });
      
      // Notify parent to refresh data
      onUpdate({ 
        ...startup, 
        stage: 'Rejected',
        status: 'Rejected',
        rejectionRemark,
        rejectedDate: new Date().toISOString(),
        rejectedFromStage: startup.stage
      });
      
      setShowRejectionModal(false);
      onClose();
      alert(`${getField(startup, 'companyName')} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting startup:', error);
      alert('❌ Failed to reject startup: ' + error.message);
    }
  };

  const handleOneOnOne = () => {
    const companyName = getField(startup, 'companyName');
    setConfirmationModal({
      isOpen: true,
      title: 'Move to One-on-One?',
      message: `Are you sure you want to move "${companyName}" from ${startup.stage} to One-on-One mentorship stage?`,
      type: 'info',
      onConfirm: async () => {
        try {
          await startupApi.update(startup.id, { stage: 'One-on-One' });
          onUpdate({ ...startup, stage: 'One-on-One' });
          onClose();
          alert(`✅ ${companyName} has been moved to One-on-One stage!`);
        } catch (error) {
          console.error('Error moving to One-on-One:', error);
          alert('❌ Failed to move startup: ' + error.message);
        }
      }
    });
  };

  const handleGraduate = () => {
    const companyName = getField(startup, 'companyName');
    setConfirmationModal({
      isOpen: true,
      title: 'Graduate Startup?',
      message: `Are you sure you want to graduate "${companyName}"? This means they have completed their incubation period and will be marked as Graduated.`,
      type: 'info',
      onConfirm: async () => {
        const graduationDate = prompt('Enter graduation date (YYYY-MM-DD) or leave empty for today:');
        const dateToUse = graduationDate || new Date().toISOString().split('T')[0];
        try {
          await startupApi.update(startup.id, {
            stage: 'Graduated',
            status: 'Graduated',
            graduatedDate: dateToUse
          });
          onUpdate({ 
            ...startup, 
            stage: 'Graduated',
            status: 'Graduated',
            graduatedDate: dateToUse
          });
          onClose();
          alert(`✅ ${companyName} has been graduated!`);
        } catch (error) {
          console.error('Error graduating startup:', error);
          alert('❌ Failed to graduate startup: ' + error.message);
        }
      }
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'warning'
    });
  };

  const isLocked = startup.status === 'Rejected' || startup.status === 'Graduated';
  const canGraduate = startup.status === 'Onboarded';
  const isS0 = startup.stage === 'S0' && startup.status === 'Active';
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
        <div className={`bg-gradient-to-r ${getStageColor(startup.stage)} p-4 sm:p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-2xl sm:text-3xl font-bold">{getField(startup, 'companyName')}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusColor(startup.status)}`}>
                  {startup.status}
                </span>
                {/* Only show stage badge if it's different from status */}
                {startup.stage !== startup.status && (
                  <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                    {startup.stage}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm sm:text-base">
                <p className="text-white/90">Magic Code: {getField(startup, 'magicCode')}</p>
                <p className="text-white/90">Founder: {getField(startup, 'founderName')}</p>
                <p className="text-white/80 text-xs sm:text-sm">{getField(startup, 'city')} • {getField(startup, 'sector')}</p>
              </div>
            </div>
            <div className="flex space-x-2 ml-2">
              <GenerateReportButton startup={startup} />
              {!isLocked && startup.status !== 'Onboarded' && startup.status !== 'Graduated' && (
                <GuestRestrictedButton
                  isGuest={isGuest}
                  onClick={() => setShowEditProfile(true)}
                  actionType="edit"
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Edit Profile"
                >
                  <Edit className="w-6 h-6" />
                </GuestRestrictedButton>
              )}
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
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-4">
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

          {/* S0 Stage Actions - Reject Button */}
          {isS0 && !isLocked && (
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

          {/* Action Buttons for S1, S2, S3 stages - NOT for Graduated */}
          {['S1', 'S2', 'S3'].includes(startup.stage) && !isLocked && !canGraduate && startup.status !== 'Graduated' && (
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

          {/* One-on-One Stage Actions - Reject and Onboard */}
          {isOneOnOne && !isLocked && (
            <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
              <div className="w-full mb-2">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>One-on-One Mentorship Stage</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  After mentorship sessions, you can onboard or reject this startup.
                </p>
              </div>
              <GuestRestrictedButton
                isGuest={isGuest}
                onClick={handleOnboard}
                actionType="onboard"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Onboard Startup</span>
              </GuestRestrictedButton>
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

          {/* Graduation Button for Onboarded Startups ONLY */}
          {canGraduate && startup.status !== 'Graduated' && (
            <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="w-full mb-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This startup is currently onboarded. You can graduate them when they complete their incubation period (typically 18 months).
                </p>
              </div>
              <GuestRestrictedButton
                isGuest={isGuest}
                onClick={handleGraduate}
                actionType="graduate"
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Graduate Startup</span>
              </GuestRestrictedButton>
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
              {getField(startup, 'dpiitNo') && <Field label="DPIIT No." value={getField(startup, 'dpiitNo')} />}
              {getField(startup, 'recognitionDate') && <Field label="Recognition Date" value={getField(startup, 'recognitionDate')} />}
              {getField(startup, 'bhaskarId') && <Field label="Bhaskar ID" value={getField(startup, 'bhaskarId')} />}
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

          {/* Documents Section - Admin Only */}
          {!isGuest && (
            <Section title="Documents" section="documents">
              <DocumentList startupId={startup.id} isGuest={isGuest} allowUpload={true} />
            </Section>
          )}

          {/* Onboard Details - Show for Onboarded and Graduated */}
          {(startup.status === 'Onboarded' || startup.status === 'Graduated') && (
            <Section title="Onboard Details" section="onboarding">
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">Description</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                      {startup.onboardingDescription || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Agreement Date" value={startup.agreementDate ? new Date(startup.agreementDate).toLocaleDateString() : 'N/A'} />
                    <Field label="Engagement Medium" value={startup.engagementMedium || 'N/A'} />
                    <Field label="Onboarded On" value={startup.onboardedDate ? new Date(startup.onboardedDate).toLocaleDateString() : 'N/A'} />
                  </div>
                  {startup.agreementCopy && startup.agreementCopy.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold block mb-2">
                        Agreement Copy
                      </span>
                      {startup.agreementCopy.startsWith('data:image') ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                          <img
                            src={startup.agreementCopy}
                            alt="Agreement Copy"
                            className="max-h-64 mx-auto object-contain rounded"
                          />
                          <a
                            href={startup.agreementCopy}
                            download={`${getField(startup, 'companyName')}-agreement.jpg`}
                            className="mt-3 inline-flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Agreement</span>
                          </a>
                        </div>
                      ) : startup.agreementCopy.startsWith('data:application/pdf') ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <Download className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">PDF Document</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Agreement copy uploaded</p>
                            </div>
                          </div>
                          <a
                            href={startup.agreementCopy}
                            download={`${getField(startup, 'companyName')}-agreement.pdf`}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Agreement PDF</span>
                          </a>
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">Document File</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Agreement copy uploaded</p>
                            </div>
                          </div>
                          <a
                            href={startup.agreementCopy}
                            download={`${getField(startup, 'companyName')}-agreement`}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Agreement Copy</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  {(!startup.agreementCopy || startup.agreementCopy.length === 0) && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold block mb-2">
                        Agreement Copy
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No agreement copy uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          )}

          {startup.pitchHistory && startup.pitchHistory.length > 0 && (
            <Section title="Pitch (SMC) History" section="pitchHistory">
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

          {startup.oneOnOneHistory && startup.oneOnOneHistory.length > 0 && (
            <Section title="One-on-One Sessions" section="oneOnOne">
              <div className="space-y-4">
                {startup.oneOnOneHistory.map((session, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Session {index + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <Field label="Date" value={session.date} />
                      <Field label="Time" value={session.time} />
                      <Field label="Mentor" value={session.mentorName} />
                    </div>
                    <Field label="Feedback" value={session.feedback} />
                    <Field label="Progress" value={session.progress} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Progress Tracking Section - Show for Onboarded and Graduated */}
          {(startup.status === 'Onboarded' || startup.status === 'Graduated') && startup.progressHistory && startup.progressHistory.length > 0 && (
            <Section title="Progress Tracking" section="progressTracking">
              <div className="space-y-4">
                {startup.progressHistory.slice().reverse().map((record, index) => {
                  // Parse notes from the progress record
                  let notes = {};
                  try {
                    notes = typeof record.notes === 'string' ? JSON.parse(record.notes) : (record.notes || {});
                  } catch (e) {
                    notes = {};
                  }
                  
                  const hasProgressData = notes.proofOfConcept || notes.prototypeDevelopment || notes.productDevelopment || notes.fieldTrials || notes.marketLaunch;
                  const hasMetrics = notes.numberOfEmployees || notes.ipRegistrations || notes.gemPortalProducts || notes.successStories;
                  const hasFunding = notes.loans || notes.angelFunding || notes.vcFunding || notes.quarterlyTurnover || notes.quarterlyGST;
                  
                  return (
                    <div key={record.id || index} className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5" />
                          <span>Progress Update - {record.date ? new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}</span>
                        </h4>
                      </div>
                      
                      {/* Section 1: Progress of Startup */}
                      {hasProgressData && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>1. Progress of Startup</span>
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {notes.proofOfConcept && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Proof of Concept</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.proofOfConcept}</p>
                              </div>
                            )}
                            {notes.prototypeDevelopment && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Prototype Development</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.prototypeDevelopment}</p>
                              </div>
                            )}
                            {notes.productDevelopment && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Product Development</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.productDevelopment}</p>
                              </div>
                            )}
                            {notes.fieldTrials && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Field Trials</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.fieldTrials}</p>
                              </div>
                            )}
                            {notes.marketLaunch && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-blue-200 dark:border-blue-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Market Launch</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.marketLaunch}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Section 2: Other Metrics */}
                      {hasMetrics && (
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2 flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>2. Other Metrics</span>
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {notes.numberOfEmployees && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Number of Employees</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.numberOfEmployees}</p>
                              </div>
                            )}
                            {notes.ipRegistrations && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">IP Registrations</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.ipRegistrations}</p>
                              </div>
                            )}
                            {notes.gemPortalProducts && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">GEM Portal Products</span>
                                <p className="font-medium text-gray-900 dark:text-white">{notes.gemPortalProducts}</p>
                              </div>
                            )}
                          </div>
                          {notes.successStories && (
                            <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-700">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Success Stories</span>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{notes.successStories}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Section 3: Funds Raised */}
                      {hasFunding && (
                        <div>
                          <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>3. Funds Raised</span>
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {notes.loans && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Loans (INR)</span>
                                <p className="font-medium text-green-600 dark:text-green-400">₹{Number(notes.loans).toLocaleString()}</p>
                              </div>
                            )}
                            {notes.angelFunding && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Angel Funding (INR)</span>
                                <p className="font-medium text-green-600 dark:text-green-400">₹{Number(notes.angelFunding).toLocaleString()}</p>
                              </div>
                            )}
                            {notes.vcFunding && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">VC Funding (INR)</span>
                                <p className="font-medium text-green-600 dark:text-green-400">₹{Number(notes.vcFunding).toLocaleString()}</p>
                              </div>
                            )}
                            {notes.quarterlyTurnover && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Quarterly Turnover (INR)</span>
                                <p className="font-medium text-green-600 dark:text-green-400">₹{Number(notes.quarterlyTurnover).toLocaleString()}</p>
                              </div>
                            )}
                            {notes.quarterlyGST && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-700">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Quarterly GST (INR)</span>
                                <p className="font-medium text-green-600 dark:text-green-400">₹{Number(notes.quarterlyGST).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
      </motion.div>
      {/* Modals */}
      <AnimatePresence>
        {showEditProfile && (
          <EditStartupProfile
            startup={startup}
            onClose={() => setShowEditProfile(false)}
            onUpdate={(updatedStartup) => {
              onUpdate(updatedStartup);
              setShowEditProfile(false);
            }}
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
    </motion.div>
  );
}
