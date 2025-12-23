import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Edit2, Trash2, IndianRupee, Calendar, FileText, Loader2 } from 'lucide-react';
import { revenueApi } from '../utils/api';

export default function RevenueManager({ startup, onUpdate, isGuest = false }) {
  const [entries, setEntries] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    description: ''
  });

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
      // Fallback to startup data if API fails
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
        // Pass updated startup with new revenue entries and total
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
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
          <FileText className="w-4 h-4 text-green-500" />
          <span>Revenue History</span>
        </h4>

        {entries.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
            No revenue entries yet
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.map((entry) => (
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
