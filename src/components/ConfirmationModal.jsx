import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Yes', 
  cancelText = 'No',
  type = 'warning' // 'warning', 'danger', 'info'
}) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          border: 'border-red-200 dark:border-red-700',
          icon: 'text-red-500',
          button: 'bg-red-500 hover:bg-red-600'
        };
      case 'info':
        return {
          bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
          border: 'border-blue-200 dark:border-blue-700',
          icon: 'text-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
      default: // warning
        return {
          bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
          border: 'border-yellow-200 dark:border-yellow-700',
          icon: 'text-yellow-500',
          button: 'bg-yellow-500 hover:bg-yellow-600'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className={`p-6 rounded-t-2xl bg-gradient-to-r ${styles.bg} border-b-2 ${styles.border}`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full bg-white dark:bg-gray-800 ${styles.icon}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col sm:flex-row justify-end gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelText}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              onClose();
              // Execute after a small delay to allow modal to close
              setTimeout(() => {
                onConfirm();
              }, 100);
            }}
            className={`px-6 py-2.5 ${styles.button} text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all`}
          >
            {confirmText}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
