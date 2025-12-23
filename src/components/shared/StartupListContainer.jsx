import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartupGridCard from '../StartupGridCard';
import StartupCard from '../StartupCard';
import StartupDetailModal from '../StartupDetailModal';
import ViewToggle from '../ViewToggle';

/**
 * StartupListContainer - Unified container for displaying startup lists
 * Handles loading, filtering, and display logic across all startup pages
 * 
 * @param {Object} props
 * @param {Array} props.startups - Array of startup objects to display
 * @param {boolean} props.loading - Loading state
 * @param {string} props.viewMode - 'grid' or 'list'
 * @param {Function} props.onViewModeChange - Callback when view mode changes
 * @param {Function} props.onUpdate - Callback when a startup is updated
 * @param {Function} props.onDelete - Callback when a startup is deleted
 * @param {boolean} props.isGuest - Whether user is a guest
 * @param {string} props.emptyMessage - Message to show when no startups found
 * @param {React.ReactNode} props.renderCard - Custom card renderer (optional)
 */
export default function StartupListContainer({
  startups = [],
  loading = false,
  viewMode = 'grid',
  onViewModeChange,
  onUpdate,
  onDelete,
  isGuest = false,
  emptyMessage = 'No startups found',
  renderCard,
  showViewToggle = true
}) {
  const [selectedStartup, setSelectedStartup] = useState(null);

  // Dynamic grid columns based on number of startups
  const getGridColumns = useCallback(() => {
    const count = startups.length;
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    if (count <= 12) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';
  }, [startups.length]);

  const handleStartupClick = useCallback((startup) => {
    setSelectedStartup(startup);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedStartup(null);
  }, []);

  const handleUpdate = useCallback(async (updatedStartup) => {
    if (onUpdate) {
      await onUpdate(updatedStartup);
    }
  }, [onUpdate]);

  // Loading state
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">Loading startups...</p>
      </motion.div>
    );
  }

  // Empty state
  if (startups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600"
      >
        <p className="text-gray-700 dark:text-gray-200 text-base sm:text-lg font-medium">
          {emptyMessage}
        </p>
      </motion.div>
    );
  }

  // Default card renderer
  const defaultRenderCard = (startup) => {
    if (viewMode === 'grid') {
      return (
        <StartupGridCard
          key={startup.id}
          startup={startup}
          onUpdate={handleUpdate}
          onDelete={onDelete}
          onClick={() => handleStartupClick(startup)}
          isGuest={isGuest}
          isCompact={startups.length > 8}
        />
      );
    }
    return (
      <StartupCard
        key={startup.id}
        startup={startup}
        onUpdate={handleUpdate}
        onDelete={onDelete}
        isGuest={isGuest}
      />
    );
  };

  const cardRenderer = renderCard || defaultRenderCard;

  return (
    <>
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={`grid ${getGridColumns()} gap-3 sm:gap-4`}>
          <AnimatePresence>
            {startups.map((startup) => cardRenderer(startup))}
          </AnimatePresence>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4 sm:space-y-6">
          <AnimatePresence>
            {startups.map((startup) => cardRenderer(startup))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStartup && (
          <StartupDetailModal
            startup={selectedStartup}
            onClose={handleCloseModal}
            onUpdate={handleUpdate}
            isGuest={isGuest}
          />
        )}
      </AnimatePresence>
    </>
  );
}
