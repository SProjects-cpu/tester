import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, ArrowRight, Calendar, User, Building2, Loader2 } from 'lucide-react';
import { stageHistoryApi } from '../utils/api';

export default function HistoryPanel({ 
  isOpen, 
  onClose, 
  sectionType,
  title = 'Section History'
}) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map section types to the stages they track
  const sectionStageMap = {
    'onboarded': 'Onboarded',
    'graduated': 'Graduated',
    'rejected': 'Rejected',
    'inactive': 'Inactive',
    'smc': 'S0',
    'one-on-one': 'One-on-One'
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, sectionType]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const fromStage = sectionStageMap[sectionType];
      if (!fromStage) {
        setHistoryData([]);
        return;
      }
      
      const data = await stageHistoryApi.getByFromStage(fromStage);
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load history data');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'S0': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'One-on-One': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Onboarded': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'Graduated': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      'Inactive': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <History className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">{title}</h2>
                  <p className="text-sm text-white/80">
                    Startups that moved from this section
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={loadHistory}
                  className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  Retry
                </button>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No history records found
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Startups that move out of this section will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Startup Info */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                        <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {entry.startupName || 'Unknown Startup'}
                        </h3>
                        {entry.founderName && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{entry.founderName}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stage Transition */}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(entry.fromStage)}`}>
                        {entry.fromStage}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(entry.toStage)}`}>
                        {entry.toStage}
                      </span>
                    </div>

                    {/* Reason */}
                    {entry.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium">Reason:</span> {entry.reason}
                      </p>
                    )}

                    {/* Date and Performer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {entry.createdAt 
                            ? new Date(entry.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Unknown date'}
                        </span>
                      </div>
                      {entry.performedBy && (
                        <span>by {entry.performedBy}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Showing {historyData.length} transition{historyData.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
