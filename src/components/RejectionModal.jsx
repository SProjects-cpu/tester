import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

export default function RejectionModal({ startup, onClose, onConfirm }) {
  const [rejectionRemark, setRejectionRemark] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!rejectionRemark.trim()) {
      setError('Rejection reason is required');
      return;
    }
    onConfirm(rejectionRemark);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Reject Startup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Company:</strong> {startup.companyName}
            </p>
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Founder:</strong> {startup.founderName}
            </p>
            <p className="text-sm text-red-800 dark:text-red-200 mt-2">
              <strong>Current Stage:</strong> {startup.stage}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionRemark}
              onChange={(e) => {
                setRejectionRemark(e.target.value);
                setError('');
              }}
              rows={4}
              placeholder="Please provide a detailed reason for rejecting this startup..."
              className={`w-full px-4 py-3 border-2 ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none`}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
            >
              Confirm Rejection
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
