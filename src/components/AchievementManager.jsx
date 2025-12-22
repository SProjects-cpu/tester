import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, FileText, Image as ImageIcon, Award, Calendar, ExternalLink, Edit2, Trash2, Download, Eye } from 'lucide-react';
import { achievementApi } from '../utils/api';

// Helper function to handle viewing/downloading base64 data URLs
const handleViewAttachment = (mediaUrl, title) => {
  if (!mediaUrl) return;
  
  // Check if it's a base64 data URL
  if (mediaUrl.startsWith('data:')) {
    // Extract mime type and data
    const matches = mediaUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create object URL and open/download
      const blobUrl = URL.createObjectURL(blob);
      
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        // Open in new tab for images and PDFs
        window.open(blobUrl, '_blank');
      } else {
        // Download for other file types
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = title || 'attachment';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  } else {
    // Regular URL - open directly
    window.open(mediaUrl, '_blank');
  }
};

// Check if mediaUrl is an image
const isImageUrl = (url) => {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
};

export default function AchievementManager({ startup, onUpdate, isGuest = false }) {
  const [achievements, setAchievements] = useState(startup.achievements || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Patent',
    attachments: [],
    patentNumber: '',
    patentStatus: '',
    filingDate: '',
    awardName: '',
    awardingOrganization: '',
    awardCategory: '',
    goalType: '',
    targetValue: '',
    achievedValue: '',
    upgradeType: '',
    previousVersion: '',
    newVersion: ''
  });

  const resetForm = () => {
    setNewAchievement({
      title: '',
      description: '',
      date: '',
      type: 'Patent',
      attachments: [],
      patentNumber: '',
      patentStatus: '',
      filingDate: '',
      awardName: '',
      awardingOrganization: '',
      awardCategory: '',
      goalType: '',
      targetValue: '',
      achievedValue: '',
      upgradeType: '',
      previousVersion: '',
      newVersion: ''
    });
    setEditingAchievement(null);
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.title || !newAchievement.description) {
      alert('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      // Create achievement via API
      const achievementData = {
        title: newAchievement.title,
        description: newAchievement.description,
        type: newAchievement.type,
        date: newAchievement.date || new Date().toISOString(),
        mediaUrl: newAchievement.attachments.length > 0 ? newAchievement.attachments[0].data : null
      };

      const createdAchievement = await achievementApi.create(startup.id, achievementData);
      
      const updatedAchievements = [...achievements, createdAchievement];
      setAchievements(updatedAchievements);
      
      // Update parent component
      onUpdate({
        ...startup,
        achievements: updatedAchievements
      });

      resetForm();
      setShowAddForm(false);
      alert('Achievement added successfully!');
    } catch (error) {
      console.error('Error creating achievement:', error);
      alert('Failed to add achievement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAchievement = async () => {
    if (!newAchievement.title || !newAchievement.description) {
      alert('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const achievementData = {
        title: newAchievement.title,
        description: newAchievement.description,
        type: newAchievement.type,
        date: newAchievement.date || new Date().toISOString(),
        mediaUrl: newAchievement.attachments.length > 0 ? newAchievement.attachments[0].data : editingAchievement.mediaUrl
      };

      const updatedAchievement = await achievementApi.update(startup.id, editingAchievement.id, achievementData);
      
      const updatedAchievements = achievements.map(a => 
        a.id === editingAchievement.id ? updatedAchievement : a
      );
      setAchievements(updatedAchievements);
      
      onUpdate({
        ...startup,
        achievements: updatedAchievements
      });

      resetForm();
      setShowAddForm(false);
      alert('Achievement updated successfully!');
    } catch (error) {
      console.error('Error updating achievement:', error);
      alert('Failed to update achievement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (!confirm('Are you sure you want to delete this achievement?')) {
      return;
    }

    setLoading(true);
    try {
      await achievementApi.delete(startup.id, achievementId);
      
      const updatedAchievements = achievements.filter(a => a.id !== achievementId);
      setAchievements(updatedAchievements);
      
      onUpdate({
        ...startup,
        achievements: updatedAchievements
      });

      alert('Achievement deleted successfully!');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      alert('Failed to delete achievement: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (achievement) => {
    setEditingAchievement(achievement);
    setNewAchievement({
      title: achievement.title || '',
      description: achievement.description || '',
      date: achievement.date ? achievement.date.split('T')[0] : '',
      type: achievement.type || 'Patent',
      attachments: achievement.mediaUrl ? [{ data: achievement.mediaUrl, name: 'Existing file' }] : [],
      patentNumber: achievement.patentNumber || '',
      patentStatus: achievement.patentStatus || '',
      filingDate: achievement.filingDate || '',
      awardName: achievement.awardName || '',
      awardingOrganization: achievement.awardingOrganization || '',
      awardCategory: achievement.awardCategory || '',
      goalType: achievement.goalType || '',
      targetValue: achievement.targetValue || '',
      achievedValue: achievement.achievedValue || '',
      upgradeType: achievement.upgradeType || '',
      previousVersion: achievement.previousVersion || '',
      newVersion: achievement.newVersion || ''
    });
    setShowAddForm(true);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAchievement(prev => ({
          ...prev,
          attachments: [...prev.attachments, {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (index) => {
    setNewAchievement(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getFileIcon = (type) => {
    if (type && type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Patent': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Award': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Success Goal': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Upgrade': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Update': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievements & Updates
        </h3>
        {!isGuest && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add New'}
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-4"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
            </h4>
            
            {/* Achievement Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Achievement Type *
              </label>
              <select
                value={newAchievement.type}
                onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value })}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Patent">Patent</option>
                <option value="Award">Award</option>
                <option value="Success Goal">Success Goal</option>
                <option value="Upgrade">Upgrade</option>
                <option value="Update">Update</option>
              </select>
            </div>

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newAchievement.date}
                  onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                  placeholder="Enter achievement title"
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                placeholder="Describe the achievement..."
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments (Images, PDFs, Documents)
              </label>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-green-500 transition-all">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload files (Max 10MB each)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {newAchievement.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {newAchievement.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {file.name}
                        </span>
                        {file.size && (
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.size)})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={editingAchievement ? handleEditAchievement : handleAddAchievement}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingAchievement ? 'Update Achievement' : 'Add Achievement')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievements List */}
      <div className="space-y-3">
        {achievements.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No achievements added yet</p>
          </div>
        ) : (
          achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(achievement.type)}`}>
                      {achievement.type}
                    </span>
                    {achievement.date && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(achievement.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {achievement.description}
                  </p>
                </div>
                
                {/* Edit/Delete buttons for admin */}
                {!isGuest && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => startEdit(achievement)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteAchievement(achievement.id)}
                      disabled={loading}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              {achievement.mediaUrl && (
                <div className="mt-3">
                  {isImageUrl(achievement.mediaUrl) ? (
                    <div className="space-y-2">
                      <img 
                        src={achievement.mediaUrl} 
                        alt={achievement.title}
                        className="max-w-full h-auto max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleViewAttachment(achievement.mediaUrl, achievement.title)}
                      />
                      <button
                        onClick={() => handleViewAttachment(achievement.mediaUrl, achievement.title)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-fit"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-gray-700 dark:text-gray-300">View Full Size</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleViewAttachment(achievement.mediaUrl, achievement.title)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-fit"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-gray-700 dark:text-gray-300">View Attachment</span>
                      <Download className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
