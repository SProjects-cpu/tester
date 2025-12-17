import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, FileText, Calendar, Users, Upload } from 'lucide-react';

export default function OnboardingModal({ startup, onClose, onConfirm }) {
  const [formData, setFormData] = useState({
    description: '',
    agreementDate: new Date().toISOString().split('T')[0],
    engagementMedium: 'Physical',
    agreementCopy: ''
  });

  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type (PDF, DOC, DOCX, JPG, PNG)
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF, DOC, DOCX, JPG, and PNG files are allowed');
        return;
      }

      setFileName(file.name);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, agreementCopy: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.description || !formData.agreementDate) {
      alert('Please fill in all required fields');
      return;
    }

    onConfirm({
      ...formData,
      onboardedDate: new Date().toISOString()
    });
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Onboard Startup 
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {startup.companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Description of the Startup <span className="text-red-500">*</span></span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
              placeholder="Enter a brief description of the startup, its products/services, and key highlights..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Provide details about the startup's business model, target market, and unique value proposition
            </p>
          </div>

          {/* Agreement Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Agreement Date <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              value={formData.agreementDate}
              onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Date when the onboarding agreement was signed
            </p>
          </div>

          {/* Engagement Medium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Medium of Engagement <span className="text-red-500">*</span></span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Physical', 'Virtual', 'Hybrid'].map((medium) => (
                <motion.button
                  key={medium}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, engagementMedium: medium })}
                  className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    formData.engagementMedium === medium
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {medium}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select how you will engage with this startup
            </p>
          </div>

          {/* Agreement Copy Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload Agreement Copy</span>
            </label>
            <div className="relative">
              <input
                type="file"
                id="agreementFile"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="agreementFile"
                className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all"
              >
                <div className="text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {fileName ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        ✓ {fileName}
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-green-600 dark:text-green-400">Click to upload</span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                  </p>
                </div>
              </label>
            </div>
            {fileName && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={() => {
                  setFileName('');
                  setFormData({ ...formData, agreementCopy: '' });
                  document.getElementById('agreementFile').value = '';
                }}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Remove file
              </motion.button>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>Note:</strong> Once onboarded, this startup will be moved to the Onboarded section where you can track achievements, revenue, and eventually graduate them.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Onboard Startup
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
