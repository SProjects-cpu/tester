import { motion } from 'framer-motion';
import { Grid3x3, List } from 'lucide-react';

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-md">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewChange('grid')}
        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
          view === 'grid'
            ? 'magic-gradient text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Grid</span>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewChange('list')}
        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
          view === 'list'
            ? 'magic-gradient text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <List className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">List</span>
      </motion.button>
    </div>
  );
}
