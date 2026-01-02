import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Edit2, Trash2, IndianRupee, Calendar, FileText, Loader2, Upload, Download, Eye, X, Paperclip, Filter } from 'lucide-react';
import { revenueApi, documentApi } from '../utils/api';

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['pdf', 'pptx', 'ppt', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const isValidFileType = (filename) => {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function RevenueManager({ startup, onUpdate, isGuest = false }) {
  const [entries, setEntries] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    description: ''
  });

  // Get unique years from entries for the filter dropdown
  const availableYears = useMemo(() => {
    const years = new Set();
    entries.forEach(entry => {
      if (entry.date) {
        const year = new Date(entry.date).getFullYear();
        if (!isNaN(year)) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
  }, [entries]);

  // Filter entries by selected year
  const filteredEntries = useMemo(() => {
    if (selectedYear === 'all') return entries;
    return entries.filter(entry => {
      if (!entry.date) return false;
      const entryYear = new Date(entry.date).getFullYear();
      return entryYear === parseInt(selectedYear);
    });
  }, [entries, selectedYear]);

  // Calculate filtered total revenue
  const filteredTotalRevenue = useMemo(() => {
    return filteredEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  }, [filteredEntries]);

  useEffect(() => {
    loadRevenue();
  }, [startup.id]);

  const loadRevenue = async () => {
    try {
      setLoading(true);
      const data = await revenueApi.getByStartupId(startup.id);
      setEntries(data.entries || []);
      setTotalRevenue(data.total || 0);
      return data;
    } catch (error) {
      console.error('Error loading revenue:', error);
      setEntries(startup.revenueHistory || []);
      setTotalRevenue(startup.totalRevenue || 0);
      return { entries: startup.revenueHistory || [], total: startup.totalRevenue || 0 };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      if (editingEntry) {
        await revenueApi.update(startup.id, editingEntry.id, formData);
      } else {
        await revenueApi.create(startup.id, formData);
      }
      const revenueData = await loadRevenue();
      resetForm();
      if (onUpdate) {
        onUpdate({ 
          ...startup, 
          totalRevenue: revenueData?.total || totalRevenue,
          revenueEntries: revenueData?.entries || entries
        });
      }
    } catch (error) {
      console.error('Error saving revenue:', error);
      alert('Failed to save revenue entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this revenue entry?')) return;

    setSaving(true);
    try {
      await revenueApi.delete(startup.id, entryId);
      const revenueData = await loadRevenue();
      if (onUpdate) {
        onUpdate({ 
          ...startup, 
          totalRevenue: revenueData?.total || totalRevenue,
          revenueEntries: revenueData?.entries || entries
        });
      }
    } catch (error) {
      console.error('Error deleting revenue:', error);
      alert('Failed to delete revenue entry: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      amount: entry.amount.toString(),
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      source: entry.source || '',
      description: entry.description || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      source: '',
      description: ''
    });
    setShowForm(false);
  };

  // Document handling functions
  const handleDocumentUpload = async (entryId, file) => {
    if (!file) return;

    if (!isValidFileType(file.name)) {
      alert(`File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds maximum limit of 10MB');
      return;
    }

    try {
      setUploadingDocId(entryId);
      await documentApi.upload(file, startup.id, entryId);
      await loadRevenue();
      alert('✅ Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('❌ Failed to upload document: ' + error.message);
    } finally {
      setUploadingDocId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentDownload = async (doc) => {
    try {
      setDownloadingDocId(doc.id);
      const { url, filename } = await documentApi.getDownloadUrl(doc.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || doc.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document: ' + error.message);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDocumentDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentApi.delete(docId);
      await loadRevenue();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Revenue Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-white/80">Total Revenue</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/80">{entries.length} entries</p>
          </div>
        </div>
      </div>

      {/* Add Revenue Button */}
      {!isGuest && !showForm && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl border-2 border-dashed border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Add Revenue Entry</span>
        </motion.button>
      )}

      {/* Revenue Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700 space-y-4"
          >
            <h4 className="font-semibold text-green-900 dark:text-green-200 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>{editingEntry ? 'Edit Revenue Entry' : 'New Revenue Entry'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g., Product Sales, Services, Grant"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingEntry ? 'Update' : 'Add'} Entry</span>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Revenue Entries List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
            <FileText className="w-4 h-4 text-green-500" />
            <span>Revenue History</span>
          </h4>
          
          {/* Year Filter Dropdown */}
          {entries.length > 0 && availableYears.length > 0 && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filtered Summary */}
        {selectedYear !== 'all' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-sm">
            <span className="text-green-700 dark:text-green-300">
              {selectedYear} Total: <strong>₹{filteredTotalRevenue.toLocaleString()}</strong> ({filteredEntries.length} entries)
            </span>
          </div>
        )}

        {filteredEntries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            {selectedYear === 'all' ? 'No revenue entries yet' : `No revenue entries for ${selectedYear}`}
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEntries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ₹{entry.amount?.toLocaleString()}
                      </span>
                      {entry.source && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                          {entry.source}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {entry.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'No date'}
                      </span>
                    </div>
                  </div>

                  {!isGuest && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={saving}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents Section for this Revenue Entry */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center space-x-1">
                      <Paperclip className="w-3 h-3" />
                      <span>Documents ({entry.documents?.length || 0})</span>
                    </span>
                    {!isGuest && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(entry.id, file);
                            e.target.value = '';
                          }}
                          disabled={uploadingDocId === entry.id}
                        />
                        <span className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
                          {uploadingDocId === entry.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>Add Document</span>
                            </>
                          )}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* Document List */}
                  {entry.documents && entry.documents.length > 0 && (
                    <div className="space-y-1">
                      {entry.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span className="truncate text-gray-700 dark:text-gray-300" title={doc.filename}>
                              {doc.filename}
                            </span>
                            <span className="text-gray-400 flex-shrink-0">
                              ({formatFileSize(doc.fileSize)})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => handleDocumentDownload(doc)}
                              disabled={downloadingDocId === doc.id}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Download"
                            >
                              {downloadingDocId === doc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                              ) : (
                                <Download className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </button>
                            {!isGuest && (
                              <button
                                onClick={() => handleDocumentDelete(doc.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="Delete"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
