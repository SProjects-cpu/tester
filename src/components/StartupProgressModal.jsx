import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, X, CheckCircle, Users, FileText, DollarSign, Award } from 'lucide-react';

export default function StartupProgressModal({ startup, onClose, onSave }) {
  const [progressData, setProgressData] = useState({
    // Date field
    date: new Date().toISOString().split('T')[0],
    
    // Progress of Startup
    proofOfConcept: '',
    prototypeDevelopment: '',
    productDevelopment: '',
    fieldTrials: '',
    marketLaunch: '',
    
    // Other Metrics
    numberOfEmployees: '',
    ipRegistrations: '',
    gemPortalProducts: '',
    successStories: '',
    
    // Quantum of Funds Raised
    loans: '',
    angelFunding: '',
    vcFunding: '',
    quarterlyTurnover: '',
    quarterlyGST: ''
  });

  const handleSubmit = () => {
    if (!progressData.date) {
      alert('Please select a date for this progress update');
      return;
    }

    // Create new progress entry
    const newProgressEntry = {
      ...progressData,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Admin' // You can replace this with actual user info
    };

    // Get existing progress history or create new array
    const progressHistory = startup.progressHistory || [];
    
    // Add new entry to history
    progressHistory.push(newProgressEntry);

    onSave({
      ...startup,
      progressHistory,
      // Keep the latest progress in progressTracking for backward compatibility
      progressTracking: {
        ...progressData,
        lastUpdated: new Date().toISOString()
      }
    });
    onClose();
  };

  const handleChange = (name, value) => {
    setProgressData(prev => ({ ...prev, [name]: value }));
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Update Startup Progress</h3>
                <p className="text-sm text-white/90">{startup.companyName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Date Field */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Progress Update Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={progressData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
          </div>

          {/* Previous Progress Records */}
          {startup.progressHistory && startup.progressHistory.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
              <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Previous Progress Records ({startup.progressHistory.length})</span>
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {startup.progressHistory.slice().reverse().map((record, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {record.date ? new Date(record.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : new Date(record.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated by {record.updatedBy || 'Admin'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {record.proofOfConcept && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">POC:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{record.proofOfConcept}</p>
                        </div>
                      )}
                      {record.numberOfEmployees && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Employees:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{record.numberOfEmployees}</p>
                        </div>
                      )}
                      {record.loans && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Loans:</span>
                          <p className="font-medium text-green-700 dark:text-green-300">₹{Number(record.loans).toLocaleString()}</p>
                        </div>
                      )}
                      {record.quarterlyTurnover && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <span className="text-gray-600 dark:text-gray-400">Turnover:</span>
                          <p className="font-medium text-green-700 dark:text-green-300">₹{Number(record.quarterlyTurnover).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Progress of Startup */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>1. Progress of Startup</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.1 Proof of Concept
                </label>
                <input
                  type="text"
                  value={progressData.proofOfConcept}
                  onChange={(e) => handleChange('proofOfConcept', e.target.value)}
                  placeholder="e.g., Not started, In progress, Completed"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.2 Prototype Development
                </label>
                <input
                  type="text"
                  value={progressData.prototypeDevelopment}
                  onChange={(e) => handleChange('prototypeDevelopment', e.target.value)}
                  placeholder="e.g., Not started, In progress, Completed"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.3 Product Development
                </label>
                <input
                  type="text"
                  value={progressData.productDevelopment}
                  onChange={(e) => handleChange('productDevelopment', e.target.value)}
                  placeholder="e.g., Not started, In progress, Completed"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.4 Field Trials
                </label>
                <input
                  type="text"
                  value={progressData.fieldTrials}
                  onChange={(e) => handleChange('fieldTrials', e.target.value)}
                  placeholder="e.g., Not started, In progress, Completed"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.5 Market Launch
                </label>
                <input
                  type="text"
                  value={progressData.marketLaunch}
                  onChange={(e) => handleChange('marketLaunch', e.target.value)}
                  placeholder="e.g., Not started, In progress, Completed"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Other Metrics */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
            <h4 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>2. Other Metrics</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.6 No. of Employees
                </label>
                <input
                  type="text"
                  value={progressData.numberOfEmployees}
                  onChange={(e) => handleChange('numberOfEmployees', e.target.value)}
                  placeholder="Enter number of employees"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.7 Cumulative IP Registrations Filed
                </label>
                <input
                  type="text"
                  value={progressData.ipRegistrations}
                  onChange={(e) => handleChange('ipRegistrations', e.target.value)}
                  placeholder="Enter number of IP registrations"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2.8 Products/Services on GEM Portal
                </label>
                <input
                  type="text"
                  value={progressData.gemPortalProducts}
                  onChange={(e) => handleChange('gemPortalProducts', e.target.value)}
                  placeholder="Enter number of products"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                2.9 Success Stories
              </label>
              <textarea
                value={progressData.successStories}
                onChange={(e) => handleChange('successStories', e.target.value)}
                placeholder="Share success stories, achievements, milestones..."
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Section 3: Quantum of Funds Raised */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700">
            <h4 className="text-lg font-bold text-green-900 dark:text-green-200 mb-4 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>3. Quantum of Funds Raised Externally</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3.1 Loans (INR)
                </label>
                <input
                  type="text"
                  value={progressData.loans}
                  onChange={(e) => handleChange('loans', e.target.value)}
                  placeholder="Enter loan amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3.2 Angel Funding (INR)
                </label>
                <input
                  type="text"
                  value={progressData.angelFunding}
                  onChange={(e) => handleChange('angelFunding', e.target.value)}
                  placeholder="Enter angel funding amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3.3 VC Funding (INR)
                </label>
                <input
                  type="text"
                  value={progressData.vcFunding}
                  onChange={(e) => handleChange('vcFunding', e.target.value)}
                  placeholder="Enter VC funding amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3.4 Turnover of Startup in Quarter (INR)
                </label>
                <input
                  type="text"
                  value={progressData.quarterlyTurnover}
                  onChange={(e) => handleChange('quarterlyTurnover', e.target.value)}
                  placeholder="Enter quarterly turnover"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  3.5 GST Filled in Quarter (INR)
                </label>
                <input
                  type="text"
                  value={progressData.quarterlyGST}
                  onChange={(e) => handleChange('quarterlyGST', e.target.value)}
                  placeholder="Enter quarterly GST amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> This progress tracking helps monitor the startup's growth and development. Update these fields regularly to maintain accurate records.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Save Progress
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
