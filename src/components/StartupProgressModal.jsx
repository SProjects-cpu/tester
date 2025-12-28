import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, X, CheckCircle, Users, Edit2, Trash2, FileText } from 'lucide-react';
import { progressApi, startupApi } from '../utils/api';

export default function StartupProgressModal({ startup, onClose, onSave }) {
  const [progressData, setProgressData] = useState({
    date: new Date().toISOString().split('T')[0],
    proofOfConcept: '',
    prototypeDevelopment: '',
    productDevelopment: '',
    fieldTrials: '',
    marketLaunch: '',
    numberOfEmployees: '',
    ipRegistrations: '',
    gemPortalProducts: '',
    successStories: '',
    loans: '',
    angelFunding: '',
    vcFunding: '',
    quarterlyTurnover: '',
    quarterlyGST: ''
  });
  const [loading, setLoading] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);

  const handleSubmit = async () => {
    if (!progressData.date) {
      alert('Please select a date for this progress update');
      return;
    }
    setLoading(true);
    try {
      if (editingProgress) {
        await progressApi.update(startup.id, editingProgress.id, {
          ...progressData,
          metric: 'Progress Update',
          value: 0
        });
        alert('Progress updated successfully!');
      } else {
        await progressApi.create(startup.id, {
          ...progressData,
          metric: 'Progress Update',
          value: 0
        });
        alert('Progress saved successfully!');
      }
      const updatedStartup = await startupApi.getById(startup.id);
      onSave(updatedStartup);
      onClose();
    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Failed to save progress: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgress = async (progressId) => {
    if (!confirm('Are you sure you want to delete this progress entry?')) return;
    setLoading(true);
    try {
      await progressApi.delete(startup.id, progressId);
      const updatedStartup = await startupApi.getById(startup.id);
      onSave(updatedStartup);
      alert('Progress entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting progress:', error);
      alert('Failed to delete progress: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseProgressNotes = (record) => {
    try {
      return typeof record.notes === 'string' ? JSON.parse(record.notes) : (record.notes || {});
    } catch (e) {
      return {};
    }
  };

  const startEditProgress = (record) => {
    setEditingProgress(record);
    const notes = parseProgressNotes(record);
    setProgressData({
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      proofOfConcept: notes.proofOfConcept || '',
      prototypeDevelopment: notes.prototypeDevelopment || '',
      productDevelopment: notes.productDevelopment || '',
      fieldTrials: notes.fieldTrials || '',
      marketLaunch: notes.marketLaunch || '',
      numberOfEmployees: notes.numberOfEmployees || '',
      ipRegistrations: notes.ipRegistrations || '',
      gemPortalProducts: notes.gemPortalProducts || '',
      successStories: notes.successStories || '',
      loans: notes.loans || '',
      angelFunding: notes.angelFunding || '',
      vcFunding: notes.vcFunding || '',
      quarterlyTurnover: notes.quarterlyTurnover || '',
      quarterlyGST: notes.quarterlyGST || ''
    });
  };

  const resetForm = () => {
    setEditingProgress(null);
    setProgressData({
      date: new Date().toISOString().split('T')[0],
      proofOfConcept: '', prototypeDevelopment: '', productDevelopment: '',
      fieldTrials: '', marketLaunch: '', numberOfEmployees: '',
      ipRegistrations: '', gemPortalProducts: '', successStories: '',
      loans: '', angelFunding: '', vcFunding: '', quarterlyTurnover: '', quarterlyGST: ''
    });
  };

  const handleChange = (name, value) => {
    setProgressData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <h3 className="text-xl font-bold">{editingProgress ? 'Edit Progress' : 'Update Startup Progress'}</h3>
                <p className="text-sm text-white/90">{startup.companyName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Progress Update Date <span className="text-red-500">*</span>
                </label>
                <input type="date" value={progressData.date} onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
              </div>
              {editingProgress && (
                <button onClick={resetForm} className="ml-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">Cancel Edit</button>
              )}
            </div>
          </div>
          {startup.progressHistory && startup.progressHistory.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
              <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" /><span>Previous Progress Records ({startup.progressHistory.length})</span>
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {startup.progressHistory.slice().reverse().map((record, index) => {
                  const notes = parseProgressNotes(record);
                  return (
                    <div key={record.id || index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-indigo-200 dark:border-indigo-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          {record.date ? new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditProgress(record)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded" title="Edit">
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button onClick={() => handleDeleteProgress(record.id)} disabled={loading} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" title="Delete">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {notes.proofOfConcept && <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded"><span className="text-gray-600 dark:text-gray-400">POC:</span><p className="font-medium text-gray-900 dark:text-white">{notes.proofOfConcept}</p></div>}
                        {notes.numberOfEmployees && <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded"><span className="text-gray-600 dark:text-gray-400">Employees:</span><p className="font-medium text-gray-900 dark:text-white">{notes.numberOfEmployees}</p></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center space-x-2"><CheckCircle className="w-5 h-5" /><span>1. Progress of Startup</span></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['proofOfConcept', 'prototypeDevelopment', 'productDevelopment', 'fieldTrials', 'marketLaunch'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input type="text" value={progressData[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder="e.g., Not started, In progress, Completed"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700">
            <h4 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4 flex items-center space-x-2"><Users className="w-5 h-5" /><span>2. Other Metrics</span></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['numberOfEmployees', 'ipRegistrations', 'gemPortalProducts'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                  <input type="text" value={progressData[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder="Enter value"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Success Stories</label>
              <textarea value={progressData.successStories} onChange={(e) => handleChange('successStories', e.target.value)} placeholder="Share success stories..." rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700">
            <h4 className="text-lg font-bold text-green-900 dark:text-green-200 mb-4 flex items-center space-x-2"><img src="/rupee-icon.png" alt="Rupee" className="w-5 h-5" /><span>3. Funds Raised</span></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Loans (₹)</label>
                <input type="text" value={progressData.loans} onChange={(e) => handleChange('loans', e.target.value)} placeholder="Enter amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Angel Funding (₹)</label>
                <input type="text" value={progressData.angelFunding} onChange={(e) => handleChange('angelFunding', e.target.value)} placeholder="Enter amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">VC Funding (₹)</label>
                <input type="text" value={progressData.vcFunding} onChange={(e) => handleChange('vcFunding', e.target.value)} placeholder="Enter amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quarterly Turnover (₹)</label>
                <input type="text" value={progressData.quarterlyTurnover} onChange={(e) => handleChange('quarterlyTurnover', e.target.value)} placeholder="Enter amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quarterly GST (₹)</label>
                <input type="text" value={progressData.quarterlyGST} onChange={(e) => handleChange('quarterlyGST', e.target.value)} placeholder="Enter amount"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex space-x-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold">Cancel</motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Saving...' : (editingProgress ? 'Update Progress' : 'Save Progress')}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
