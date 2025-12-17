import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, FileJson, FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportMenu({ 
  onExport, 
  title = 'Export',
  formats = ['pdf', 'json', 'csv', 'excel'],
  className = ''
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatConfig = {
    pdf: {
      icon: FileText,
      label: 'Export as PDF',
      description: 'Formatted document',
      color: 'text-red-600 dark:text-red-400',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20'
    },
    json: {
      icon: FileJson,
      label: 'Export as JSON',
      description: 'Complete data',
      color: 'text-purple-600 dark:text-purple-400',
      hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
    },
    csv: {
      icon: FileSpreadsheet,
      label: 'Export as CSV',
      description: 'Excel compatible',
      color: 'text-green-600 dark:text-green-400',
      hoverBg: 'hover:bg-green-50 dark:hover:bg-green-900/20'
    },
    excel: {
      icon: FileSpreadsheet,
      label: 'Export as Excel',
      description: 'Spreadsheet format',
      color: 'text-emerald-600 dark:text-emerald-400',
      hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
    }
  };

  const handleExport = (format) => {
    onExport(format);
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center"
      >
        <Download className="w-5 h-5" />
        <span>{title}</span>
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
              {formats.map((format) => {
                const config = formatConfig[format];
                const Icon = config.icon;
                
                return (
                  <motion.button
                    key={format}
                    whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
                    onClick={() => handleExport(format)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left ${config.hoverBg} transition-colors`}
                  >
                    <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
