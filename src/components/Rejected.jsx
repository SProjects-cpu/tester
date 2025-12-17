import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupGridCard from './StartupGridCard';
import StartupDetailModal from './StartupDetailModal';
import ViewToggle from './ViewToggle';
import AdminAuthModal from './AdminAuthModal';

export default function Rejected({ isGuest = false }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [adminAuthModal, setAdminAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });

  const handleExport = (format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Rejected Startups',
      message: 'Please authenticate to export rejected startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        exportStartupsComprehensive(filteredStartups, format, 'Rejected-Startups');
        alert(`Rejected startups exported as ${format.toUpperCase()}!`);
      }
    });
  };

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm]);

  const loadStartups = () => {
    const data = storage.get('startups', []).filter(s => s.status === 'Rejected');
    setStartups(data);
  };

  const filterStartups = () => {
    let filtered = startups;
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.founderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.sector?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStartups(filtered);
  };

  const handleUpdateStartup = (updatedStartup) => {
    const allStartups = storage.get('startups', []);
    const updated = allStartups.map(s => s.id === updatedStartup.id ? updatedStartup : s);
    storage.set('startups', updated);
    loadStartups();
  };

  // Dynamic grid columns based on number of startups
  const getGridColumns = () => {
    const count = filteredStartups.length;
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (count <= 8) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
    if (count <= 12) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Rejected Startups
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} rejected
          </p>
        </div>
        <ExportMenu 
          onExport={handleExport}
          title="Export"
          formats={['pdf', 'json', 'csv', 'excel']}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, founder, or sector..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={`grid ${getGridColumns()} gap-3 sm:gap-4`}>
          <AnimatePresence>
            {filteredStartups.map(startup => (
              <StartupGridCard
                key={startup.id}
                startup={startup}
                onUpdate={handleUpdateStartup}
                onDelete={() => {}}
                onClick={() => setSelectedStartup(startup)}
                isGuest={isGuest}
                isCompact={filteredStartups.length > 8}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredStartups.map(startup => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedStartup(startup)}
                className="bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-lg opacity-75 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                        {startup.companyName}
                      </h3>
                      <span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold whitespace-nowrap">
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {startup.magicCode}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Founder:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {startup.founderName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {startup.city}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Sector:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {startup.sector}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="ml-2 text-gray-900 dark:text-white truncate">
                          {startup.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Stage:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-semibold">
                          {startup.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredStartups.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl"
        >
          <p className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">
            No rejected startups found
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedStartup && (
          <StartupDetailModal
            startup={selectedStartup}
            onClose={() => setSelectedStartup(null)}
            onUpdate={handleUpdateStartup}
            isGuest={isGuest}
          />
        )}
        <AdminAuthModal
          isOpen={adminAuthModal.isOpen}
          onClose={() => setAdminAuthModal({ ...adminAuthModal, isOpen: false })}
          onConfirm={adminAuthModal.onConfirm}
          title={adminAuthModal.title}
          message={adminAuthModal.message}
          actionType={adminAuthModal.actionType}
        />
      </AnimatePresence>
    </div>
  );
}
