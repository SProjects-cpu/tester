import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Upload, Download, ChevronDown, FileJson, FileSpreadsheet } from 'lucide-react';
import { storage, generateId } from '../utils/storage';
import { exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import StartupCard from './StartupCard';
import StartupGridCard from './StartupGridCard';
import StartupDetailModal from './StartupDetailModal';
import RegistrationForm from './RegistrationForm';
import ImportStartups from './ImportStartups';
import ViewToggle from './ViewToggle';
import GuestRestrictedButton from './GuestRestrictedButton';
import AdminAuthModal from './AdminAuthModal';

export default function AllStartups({ isGuest = false, initialSectorFilter = null }) {
  const [startups, setStartups] = useState([]);
  const [filteredStartups, setFilteredStartups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterSector, setFilterSector] = useState(initialSectorFilter || 'all');
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
      title: 'Export Startups',
      message: 'Please authenticate to export startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        exportStartupsComprehensive(filteredStartups, format, 'All-Startups');
        alert(`All startups exported as ${format.toUpperCase()}!`);
      }
    });
  };

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    if (initialSectorFilter) {
      setFilterSector(initialSectorFilter);
    }
  }, [initialSectorFilter]);

  useEffect(() => {
    filterStartups();
  }, [startups, searchTerm, filterStage, filterSector]);

  const loadStartups = () => {
    const data = storage.get('startups', []);
    setStartups(data);
  };

  const filterStartups = () => {
    let filtered = startups;

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.founderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.magicCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStage !== 'all') {
      filtered = filtered.filter(s => s.stage === filterStage);
    }

    if (filterSector !== 'all') {
      filtered = filtered.filter(s => s.sector === filterSector);
    }

    setFilteredStartups(filtered);
  };

  const handleAddStartup = (startupData) => {
    const newStartup = {
      id: generateId(),
      ...startupData,
      stage: 'S0',
      status: 'Active',
      pitchHistory: [],
      oneOnOneHistory: [],
      createdAt: new Date().toISOString()
    };

    const updated = [...startups, newStartup];
    storage.set('startups', updated);
    setStartups(updated);
    setShowForm(false);
  };

  const handleImportStartups = (importedStartups) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Import Startups',
      message: `You are about to import ${importedStartups.length} startup(s). Please authenticate to proceed with this operation.`,
      actionType: 'warning',
      onConfirm: () => {
        const updated = [...startups, ...importedStartups];
        storage.set('startups', updated);
        setStartups(updated);
        setShowImport(false);
        alert(`✅ Successfully imported ${importedStartups.length} startup(s)!`);
      }
    });
  };

  const handleUpdateStartup = (updatedStartup) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Edit Startup',
      message: `You are about to edit "${updatedStartup.companyName}". Please authenticate to save changes.`,
      actionType: 'warning',
      onConfirm: () => {
        const updated = startups.map(s => s.id === updatedStartup.id ? updatedStartup : s);
        storage.set('startups', updated);
        setStartups(updated);
        alert('✅ Startup updated successfully!');
      }
    });
  };

  const handleDeleteStartup = (id) => {
    const startup = startups.find(s => s.id === id);
    setAdminAuthModal({
      isOpen: true,
      title: 'Delete Startup',
      message: `You are about to permanently delete "${startup?.companyName}". This action cannot be undone. Please authenticate to proceed.`,
      actionType: 'danger',
      onConfirm: () => {
        const updated = startups.filter(s => s.id !== id);
        storage.set('startups', updated);
        setStartups(updated);
        alert('✅ Startup deleted successfully!');
      }
    });
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold magic-text-gradient">
            All Startups
          </h1>
          <p className="text-gray-900 dark:text-gray-100 mt-2 text-sm sm:text-base">
            {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ExportMenu 
            onExport={handleExport}
            title="Export"
            formats={['pdf', 'json', 'csv', 'excel']}
          />
          <GuestRestrictedButton
            isGuest={isGuest}
            onClick={() => setShowImport(true)}
            actionType="add"
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 sm:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base whitespace-nowrap"
          >
            <Upload className="w-5 h-5" />
            <span>Import Startups</span>
          </GuestRestrictedButton>
          <GuestRestrictedButton
            isGuest={isGuest}
            onClick={() => setShowForm(true)}
            actionType="add"
            className="flex items-center justify-center space-x-2 magic-gradient text-white px-5 sm:px-6 py-3 rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span>Register Startup</span>
          </GuestRestrictedButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, founder, or magic code..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full pl-10 pr-8 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none appearance-none cursor-pointer transition-all text-sm sm:text-base"
          >
            <option value="all">All Stages</option>
            <option value="S0">S0 - Registered</option>
            <option value="S1">S1 - Stage 1</option>
            <option value="S2">S2 - Stage 2</option>
            <option value="S3">S3 - Stage 3</option>
            <option value="One-on-One">One-on-One</option>
          </select>
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="w-full pl-10 pr-8 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none appearance-none cursor-pointer transition-all text-sm sm:text-base"
          >
            <option value="all">All Sectors</option>
            {[...new Set(startups.map(s => s.sector).filter(Boolean))].sort().map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
        <ViewToggle view={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className={`grid ${getGridColumns()} gap-3 sm:gap-4`}>
          <AnimatePresence>
            {filteredStartups.map((startup) => (
              <StartupGridCard
                key={startup.id}
                startup={startup}
                onUpdate={handleUpdateStartup}
                onDelete={handleDeleteStartup}
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
        <div className="space-y-4 sm:space-y-6">
          <AnimatePresence>
            {filteredStartups.map((startup) => (
              <StartupCard
                key={startup.id}
                startup={startup}
                onUpdate={handleUpdateStartup}
                onDelete={handleDeleteStartup}
                isGuest={isGuest}
              />
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
            No startups found. Register your first startup!
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <RegistrationForm
            onClose={() => setShowForm(false)}
            onSubmit={handleAddStartup}
          />
        )}
        {showImport && (
          <ImportStartups
            onClose={() => setShowImport(false)}
            onImport={handleImportStartups}
          />
        )}
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
