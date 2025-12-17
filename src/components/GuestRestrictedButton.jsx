import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, Send } from 'lucide-react';
import { storage, generateId } from '../utils/storage';

export default function GuestRestrictedButton({ 
  isGuest, 
  onClick, 
  children, 
  className = '',
  icon: Icon,
  actionType = 'action' // 'add', 'edit', 'delete', 'schedule', 'feedback', 'onboard', 'reject'
}) {
  const [showModal, setShowModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleClick = (e) => {
    if (isGuest) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    } else {
      onClick && onClick(e);
    }
  };

  const handleRequestAccess = () => {
    const session = storage.get('adminSession');
    const accessRequests = storage.get('accessRequests', []);
    
    const newRequest = {
      id: generateId(),
      username: session.username || 'Guest User',
      actionType,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    accessRequests.push(newRequest);
    storage.set('accessRequests', accessRequests);
    
    setRequestSent(true);
    setTimeout(() => {
      setShowModal(false);
      setRequestSent(false);
    }, 2000);
  };

  const actionLabels = {
    add: 'add new items',
    edit: 'edit items',
    delete: 'delete items',
    schedule: 'schedule meetings',
    feedback: 'provide feedback',
    onboard: 'onboard startups',
    reject: 'reject startups',
    graduate: 'graduate startups',
    action: 'perform this action'
  };

  return (
    <>
      <div className="relative inline-block">
        <motion.button
          whileHover={{ scale: isGuest ? 1 : 1.05 }}
          whileTap={{ scale: isGuest ? 1 : 0.95 }}
          onClick={handleClick}
          type="button"
          className={`${className} ${isGuest ? 'opacity-60 cursor-pointer' : ''} relative`}
        >
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </motion.button>
        
        {isGuest && (
          <div className="absolute -bottom-5 left-0 right-0 text-center pointer-events-none">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center justify-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              View only mode
            </span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              {!requestSent ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
                    Guest Mode - View Only
                  </h3>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mb-4">
                    <p className="text-center text-gray-800 dark:text-gray-200 font-semibold">
                      You cannot {actionLabels[actionType]} in guest mode
                    </p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Guest accounts have read-only access. To make changes, you need admin permissions.
                  </p>
                  
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Close
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRequestAccess}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Ask Admin for Access
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Request Sent!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Admin will review your access request
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
