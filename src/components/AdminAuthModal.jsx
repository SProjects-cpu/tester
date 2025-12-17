import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, AlertTriangle } from 'lucide-react';

export default function AdminAuthModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  actionType = 'danger' // 'danger', 'warning', 'info'
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (actionType) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      // Verify admin credentials
      const response = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        // Close modal and execute action
        setEmail('');
        setPassword('');
        onClose();
        setTimeout(() => {
          onConfirm();
        }, 100);
      } else if (response.status === 401) {
        // Check if it's a token issue or credential issue
        if (data.message?.includes('token') || data.message?.includes('expired') || data.message?.includes('authorized')) {
          setError('Your session has expired. Please login again.');
          setTimeout(() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.reload();
          }, 2000);
        } else {
          setError(data.message || 'Invalid admin credentials. Please try again.');
        }
      } else {
        setError(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Authentication failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className={`p-6 rounded-t-2xl bg-gradient-to-r ${styles.bg} border-b-2 ${styles.border}`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full bg-white dark:bg-gray-800 ${styles.icon}`}>
              <Lock className="w-6 h-6" />
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
              onClick={handleClose}
              className="p-1 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This action requires admin authentication for security purposes.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleClose}
              className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className={`px-6 py-2.5 ${styles.button} text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Verifying...' : 'Authenticate & Proceed'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
