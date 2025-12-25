import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { startupApi } from '../utils/api';
import { filterByDateRange, generateExportFileName, exportStartupsComprehensive } from '../utils/exportUtils';
import ExportMenu from './ExportMenu';
import RegistrationForm from './RegistrationForm';
import ViewToggle from './ViewToggle';
import GuestRestrictedButton from './GuestRestrictedButton';
import AdminAuthModal from './AdminAuthModal';
import { PageHeader, PAGE_GRADIENTS } from './shared/PageHeader';
import SearchFilterBar, { createStageFilterOptions, createSectorFilterOptions, createDateFieldOptions } from './shared/SearchFilterBar';
import StartupListContainer from './shared/StartupListContainer';

export default function AllStartups({ isGuest = false, initialSectorFilter = null }) {
  const [startups, setStartups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState({
    stage: 'all',
    sector: initialSectorFilter || 'all',
    dateField: 'createdAt'
  });
  const [dateRange, setDateRange] = useState({ fromDate: null, toDate: null });
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [adminAuthModal, setAdminAuthModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    actionType: 'warning'
  });

  // Memoized filtering - no separate state needed, computed on render
  const filteredStartups = useMemo(() => {
    let filtered = startups;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.companyName?.toLowerCase().includes(searchLower) ||
        s.founderName?.toLowerCase().includes(searchLower) ||
        s.magicCode?.toLowerCase().includes(searchLower)
      );
    }

    if (filterValues.stage !== 'all') {
      filtered = filtered.filter(s => s.stage === filterValues.stage);
    }

    if (filterValues.sector !== 'all') {
      filtered = filtered.filter(s => s.sector === filterValues.sector);
    }

    if (dateRange.fromDate || dateRange.toDate) {
      filtered = filterByDateRange(filtered, filterValues.dateField, dateRange.fromDate, dateRange.toDate);
    }

    return filtered;
  }, [startups, searchTerm, filterValues, dateRange]);

  const loadStartups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await startupApi.getAll();
      setStartups(data);
    } catch (error) {
      console.error('Error loading startups:', error);
      alert('Failed to load startups: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  useEffect(() => {
    if (initialSectorFilter) {
      setFilterValues(prev => ({ ...prev, sector: initialSectorFilter }));
    }
  }, [initialSectorFilter]);

  const handleFilterChange = useCallback((key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleExport = useCallback((format) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Export Startups',
      message: 'Please authenticate to export startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        const fileName = generateExportFileName('All-Startups', dateRange.fromDate, dateRange.toDate);
        exportStartupsComprehensive(filteredStartups, format, fileName.replace('MAGIC-', ''));
        alert(`${filteredStartups.length} startup(s) exported as ${format.toUpperCase()}!`);
      }
    });
  }, [filteredStartups, dateRange]);

  const handleAddStartup = useCallback(async (startupData, documents = []) => {
    try {
      // Extract pitch deck file if present
      const pitchDeckFile = startupData.pitchDeck?.file;
      
      // Remove the file object from startupData before sending to API
      const cleanStartupData = { ...startupData };
      if (cleanStartupData.pitchDeck?.file) {
        delete cleanStartupData.pitchDeck;
      }
      
      const newStartup = await startupApi.create({
        ...cleanStartupData,
        stage: 'S0',
        status: 'Active'
      });
      
      const token = localStorage.getItem('token');
      let uploadedDocs = 0;
      
      // Upload pitch deck to Supabase if present
      if (pitchDeckFile) {
        const formData = new FormData();
        formData.append('file', pitchDeckFile);
        formData.append('startupId', newStartup.id);
        
        try {
          await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          uploadedDocs++;
        } catch (docError) {
          console.error('Error uploading pitch deck:', docError);
        }
      }
      
      // Upload other documents
      if (documents.length > 0) {
        for (const file of documents) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('startupId', newStartup.id);
          
          try {
            await fetch('/api/documents', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
            uploadedDocs++;
          } catch (docError) {
            console.error('Error uploading document:', docError);
          }
        }
      }
      
      setStartups([newStartup, ...startups]);
      setShowForm(false);
      alert('✅ Startup registered successfully!' + (uploadedDocs > 0 ? ` ${uploadedDocs} document(s) uploaded.` : ''));
    } catch (error) {
      console.error('Error creating startup:', error);
      alert('❌ Failed to create startup: ' + error.message);
    }
  }, [startups]);

  const handleUpdateStartup = useCallback((updatedStartup) => {
    setAdminAuthModal({
      isOpen: true,
      title: 'Edit Startup',
      message: `You are about to edit "${updatedStartup.companyName}". Please authenticate to save changes.`,
      actionType: 'warning',
      onConfirm: async () => {
        try {
          const result = await startupApi.update(updatedStartup.id, updatedStartup);
          setStartups(startups.map(s => s.id === updatedStartup.id ? result : s));
          alert('✅ Startup updated successfully!');
        } catch (error) {
          console.error('Error updating startup:', error);
          alert('❌ Failed to update startup: ' + error.message);
        }
      }
    });
  }, [startups]);

  const handleDeleteStartup = useCallback((id) => {
    const startup = startups.find(s => s.id === id);
    setAdminAuthModal({
      isOpen: true,
      title: 'Delete Startup',
      message: `You are about to permanently delete "${startup?.companyName}". This action cannot be undone. Please authenticate to proceed.`,
      actionType: 'danger',
      onConfirm: async () => {
        try {
          await startupApi.delete(id);
          setStartups(startups.filter(s => s.id !== id));
          alert('✅ Startup deleted successfully!');
        } catch (error) {
          console.error('Error deleting startup:', error);
          alert('❌ Failed to delete startup: ' + error.message);
        }
      }
    });
  }, [startups]);

  // Memoized filter configurations
  const filters = useMemo(() => [
    { key: 'stage', options: createStageFilterOptions(), defaultValue: 'all' },
    { key: 'sector', options: createSectorFilterOptions(startups), defaultValue: 'all' },
    { key: 'dateField', options: createDateFieldOptions(), defaultValue: 'createdAt' }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="All Startups"
        gradientColors={PAGE_GRADIENTS.allStartups}
        count={filteredStartups.length}
        countLabel="startup"
        actions={
          <>
            <ExportMenu 
              onExport={handleExport}
              title="Export"
              formats={['pdf', 'json', 'csv', 'excel']}
            />
            <GuestRestrictedButton
              isGuest={isGuest}
              onClick={() => setShowForm(true)}
              actionType="add"
              className="flex items-center justify-center space-x-2 magic-gradient text-white px-5 sm:px-6 py-3 rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Register Startup</span>
            </GuestRestrictedButton>
          </>
        }
      />

      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, founder, or magic code..."
        filters={filters}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        showDateFilter={true}
        onDateRangeChange={setDateRange}
        additionalControls={<ViewToggle view={viewMode} onViewChange={setViewMode} />}
      />

      <StartupListContainer
        startups={filteredStartups}
        loading={loading}
        viewMode={viewMode}
        onUpdate={handleUpdateStartup}
        onDelete={handleDeleteStartup}
        isGuest={isGuest}
        emptyMessage="No startups found. Register your first startup!"
      />

      <AnimatePresence>
        {showForm && (
          <RegistrationForm
            onClose={() => setShowForm(false)}
            onSubmit={handleAddStartup}
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
