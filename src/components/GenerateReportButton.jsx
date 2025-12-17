import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, ChevronDown } from 'lucide-react';
import { generateStartupReport, generateStartupReportWord } from '../utils/reportGenerator';

export default function GenerateReportButton({ startup, className = '' }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleGenerateReport = (format) => {
    try {
      if (format === 'pdf') {
        generateStartupReport(startup);
        alert('Comprehensive report generated successfully!');
      } else if (format === 'word') {
        generateStartupReportWord(startup);
        alert('Word document generated successfully!');
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-semibold"
      >
        <FileText className="w-4 h-4" />
        <span>Generate Report</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              <motion.button
                whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                onClick={() => handleGenerateReport('pdf')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    PDF Report
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Complete details with graphs
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                onClick={() => handleGenerateReport('word')}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    Word Document
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Editable format
                  </p>
                </div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
