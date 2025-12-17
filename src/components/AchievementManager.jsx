import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Upload, FileText, Image as ImageIcon, Award, Calendar, ExternalLink } from 'lucide-react';

export default function AchievementManager({ startup, onUpdate, isGuest = false }) {
  const [achievements, setAchievements] = useState(startup.achievements || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    date: '',
    type: 'Patent',
    attachments: [],
    // Patent specific fields
    patentNumber: '',
    patentStatus: '',
    filingDate: '',
    // Award specific fields
    awardName: '',
    awardingOrganization: '',
    awardCategory: '',
    // Success Goal specific fields
    goalType: '',
    targetValue: '',
    achievedValue: '',
    // Upgrade specific fields
    upgradeType: '',
    previousVersion: '',
    newVersion: ''
  });

  const handleAddAchievement = () => {
    if (!newAchievement.title || !newAchievement.description) {
      alert('Please fill in title and description');
      return;
    }

    const achievement = {
      id: Date.now().toString(),
      ...newAchievement,
      createdAt: new Date().toISOString()
    };

    const updatedAchievements = [...achievements, achievement];
    setAchievements(updatedAchievements);
    
    const updatedStartup = {
      ...startup,
      achievements: updatedAchievements
    };
    onUpdate(updatedStartup);

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
    setShowAddForm(false);
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
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
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
            onClick={() => setShowAddForm(!showAddForm)}
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
                  placeholder={
                    newAchievement.type === 'Patent' ? 'e.g., AI Algorithm Patent' :
                    newAchievement.type === 'Award' ? 'e.g., Best Startup Award 2024' :
                    newAchievement.type === 'Success Goal' ? 'e.g., Reached 10K Users' :
                    newAchievement.type === 'Upgrade' ? 'e.g., Platform Version 2.0' :
                    'e.g., New Partnership Announcement'
                  }
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Type-Specific Fields */}
            {newAchievement.type === 'Patent' && (
              <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300">Patent Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Patent Number
                    </label>
                    <input
                      type="text"
                      value={newAchievement.patentNumber}
                      onChange={(e) => setNewAchievement({ ...newAchievement, patentNumber: e.target.value })}
                      placeholder="e.g., US123456789"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Patent Status
                    </label>
                    <select
                      value={newAchievement.patentStatus}
                      onChange={(e) => setNewAchievement({ ...newAchievement, patentStatus: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Status</option>
                      <option value="Filed">Filed</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Granted">Granted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Filing Date
                    </label>
                    <input
                      type="date"
                      value={newAchievement.filingDate}
                      onChange={(e) => setNewAchievement({ ...newAchievement, filingDate: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {newAchievement.type === 'Award' && (
              <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-700">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">Award Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Award Name
                    </label>
                    <input
                      type="text"
                      value={newAchievement.awardName}
                      onChange={(e) => setNewAchievement({ ...newAchievement, awardName: e.target.value })}
                      placeholder="e.g., Best Innovation Award"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Awarding Organization
                    </label>
                    <input
                      type="text"
                      value={newAchievement.awardingOrganization}
                      onChange={(e) => setNewAchievement({ ...newAchievement, awardingOrganization: e.target.value })}
                      placeholder="e.g., Tech Summit 2024"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Award Category
                    </label>
                    <input
                      type="text"
                      value={newAchievement.awardCategory}
                      onChange={(e) => setNewAchievement({ ...newAchievement, awardCategory: e.target.value })}
                      placeholder="e.g., Technology, Innovation"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {newAchievement.type === 'Success Goal' && (
              <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-green-900 dark:text-green-300">Success Goal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Goal Type
                    </label>
                    <select
                      value={newAchievement.goalType}
                      onChange={(e) => setNewAchievement({ ...newAchievement, goalType: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Type</option>
                      <option value="Users">Users</option>
                      <option value="Revenue">Revenue</option>
                      <option value="Downloads">Downloads</option>
                      <option value="Customers">Customers</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Value
                    </label>
                    <input
                      type="text"
                      value={newAchievement.targetValue}
                      onChange={(e) => setNewAchievement({ ...newAchievement, targetValue: e.target.value })}
                      placeholder="e.g., 10,000"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Achieved Value
                    </label>
                    <input
                      type="text"
                      value={newAchievement.achievedValue}
                      onChange={(e) => setNewAchievement({ ...newAchievement, achievedValue: e.target.value })}
                      placeholder="e.g., 12,500"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {newAchievement.type === 'Upgrade' && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Upgrade Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upgrade Type
                    </label>
                    <select
                      value={newAchievement.upgradeType}
                      onChange={(e) => setNewAchievement({ ...newAchievement, upgradeType: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Type</option>
                      <option value="Product">Product</option>
                      <option value="Platform">Platform</option>
                      <option value="Technology">Technology</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Previous Version
                    </label>
                    <input
                      type="text"
                      value={newAchievement.previousVersion}
                      onChange={(e) => setNewAchievement({ ...newAchievement, previousVersion: e.target.value })}
                      placeholder="e.g., v1.0"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Version
                    </label>
                    <input
                      type="text"
                      value={newAchievement.newVersion}
                      onChange={(e) => setNewAchievement({ ...newAchievement, newVersion: e.target.value })}
                      placeholder="e.g., v2.0"
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description - Common for all types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                placeholder={
                  newAchievement.type === 'Patent' ? 'Describe the patent details, innovation, and impact...' :
                  newAchievement.type === 'Award' ? 'Describe the award, competition, and significance...' :
                  newAchievement.type === 'Success Goal' ? 'Describe how you achieved this goal and its impact...' :
                  newAchievement.type === 'Upgrade' ? 'Describe the upgrade features and improvements...' :
                  'Describe the update or announcement...'
                }
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

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
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(file.size)})
                        </span>
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
              onClick={handleAddAchievement}
              className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium"
            >
              Add Achievement
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
                  
                  {/* Type-specific details */}
                  {achievement.type === 'Patent' && (achievement.patentNumber || achievement.patentStatus) && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {achievement.patentNumber && <p><strong>Patent #:</strong> {achievement.patentNumber}</p>}
                      {achievement.patentStatus && <p><strong>Status:</strong> {achievement.patentStatus}</p>}
                      {achievement.filingDate && <p><strong>Filed:</strong> {new Date(achievement.filingDate).toLocaleDateString()}</p>}
                    </div>
                  )}
                  
                  {achievement.type === 'Award' && (achievement.awardName || achievement.awardingOrganization) && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {achievement.awardName && <p><strong>Award:</strong> {achievement.awardName}</p>}
                      {achievement.awardingOrganization && <p><strong>Organization:</strong> {achievement.awardingOrganization}</p>}
                      {achievement.awardCategory && <p><strong>Category:</strong> {achievement.awardCategory}</p>}
                    </div>
                  )}
                  
                  {achievement.type === 'Success Goal' && (achievement.goalType || achievement.achievedValue) && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {achievement.goalType && <p><strong>Goal Type:</strong> {achievement.goalType}</p>}
                      {achievement.targetValue && achievement.achievedValue && (
                        <p><strong>Progress:</strong> {achievement.achievedValue} / {achievement.targetValue}</p>
                      )}
                    </div>
                  )}
                  
                  {achievement.type === 'Upgrade' && (achievement.upgradeType || achievement.newVersion) && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {achievement.upgradeType && <p><strong>Type:</strong> {achievement.upgradeType}</p>}
                      {achievement.previousVersion && achievement.newVersion && (
                        <p><strong>Version:</strong> {achievement.previousVersion} → {achievement.newVersion}</p>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {achievement.attachments && achievement.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {achievement.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.data}
                      download={file.name}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {getFileIcon(file.type)}
                      <span className="text-gray-700 dark:text-gray-300">{file.name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
