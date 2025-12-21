import { motion } from 'framer-motion';
import { MapPin, User, Briefcase, Calendar, Trash2 } from 'lucide-react';
import GuestRestrictedButton from './GuestRestrictedButton';
import { getField } from '../utils/startupFieldHelper';

export default function StartupGridCard({ startup, onUpdate, onDelete, onClick, isGuest = false, isCompact = false }) {
  const getStageColor = (stage) => {
    const colors = {
      'S0': 'from-gray-500 to-gray-700',
      'S1': 'from-blue-500 to-blue-700',
      'S2': 'from-purple-500 to-purple-700',
      'S3': 'from-orange-500 to-orange-700',
      'One-on-One': 'from-indigo-500 to-indigo-700'
    };
    return colors[stage] || 'from-gray-500 to-gray-700';
  };

  const getStatusColor = (status) => {
    if (status === 'Onboarded') return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border border-green-300 dark:border-green-600';
    if (status === 'Rejected') return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-300 dark:border-red-600';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 dark:border-blue-600';
  };

  const isLocked = startup.status === 'Onboarded' || startup.status === 'Rejected';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all border border-gray-200 dark:border-gray-600 hover:shadow-xl hover:border-gray-300 dark:hover:border-gray-500 ${
        isLocked ? 'opacity-75' : ''
      }`}
      onClick={onClick}
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${getStageColor(startup.stage)} ${isCompact ? 'p-2 sm:p-3' : 'p-4 sm:p-5'} text-white relative`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Logo Display */}
            {getField(startup, 'logo') && (
              <div className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} flex-shrink-0 bg-white rounded-lg p-1 shadow-md`}>
                <img 
                  src={getField(startup, 'logo')} 
                  alt={`${getField(startup, 'companyName')} logo`}
                  className="w-full h-full object-contain rounded"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`${isCompact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-bold truncate mb-1 text-white`}>{getField(startup, 'companyName')}</h3>
              <p className={`${isCompact ? 'text-xs' : 'text-xs sm:text-sm'} text-white/90 truncate`}>{getField(startup, 'magicCode')}</p>
            </div>
          </div>
          {!isLocked && (
            <div onClick={(e) => e.stopPropagation()}>
              <GuestRestrictedButton
                isGuest={isGuest}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(startup.id);
                }}
                actionType="delete"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </GuestRestrictedButton>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} rounded-full font-medium ${getStatusColor(startup.status)}`}>
            {startup.status}
          </span>
          <span className={`${isCompact ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'} bg-white/20 rounded-full font-medium text-white`}>
            {startup.stage}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={`${isCompact ? 'p-2 sm:p-3 space-y-2' : 'p-4 sm:p-5 space-y-3'}`}>
        <div className={`flex items-center space-x-2 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-200`}>
          <User className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
          <span className="truncate font-medium">{getField(startup, 'founderName')}</span>
        </div>
        <div className={`flex items-center space-x-2 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-200`}>
          <MapPin className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
          <span className="truncate">{getField(startup, 'city')}</span>
        </div>
        <div className={`flex items-center space-x-2 ${isCompact ? 'text-xs' : 'text-sm'} text-gray-700 dark:text-gray-200`}>
          <Briefcase className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0 text-gray-500 dark:text-gray-400`} />
          <span className="truncate">{getField(startup, 'sector')}</span>
        </div>
        {getField(startup, 'registeredDate') && !isCompact && (
          <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
            <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
            <span className="truncate">{new Date(getField(startup, 'registeredDate')).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`${isCompact ? 'px-2 sm:px-3 pb-2 sm:pb-3' : 'px-4 sm:px-5 pb-4 sm:pb-5'}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClick}
          className={`w-full ${isCompact ? 'py-1 text-xs' : 'py-2 text-sm'} font-semibold text-purple-600 dark:text-purple-400 border-2 border-purple-500 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all`}
        >
          View Details
        </motion.button>
      </div>
    </motion.div>
  );
}
