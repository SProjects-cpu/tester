import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Eye, EyeOff, UserPlus, Edit2, Check, X, Calendar } from 'lucide-react';
import { guestApi } from '../utils/api';

export default function GuestManagement() {
  const [guests, setGuests] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [newGuest, setNewGuest] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    phone: '', 
    organization: '', 
    purpose: '',
    expiresAt: ''
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const data = await guestApi.getAll();
      setGuests(data);
    } catch (error) {
      console.error('Error loading guests:', error);
      // If API fails, guests array stays empty
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    
    if (!newGuest.name || !newGuest.email || !newGuest.password) {
      alert('Name, email, and password are required');
      return;
    }

    try {
      const guest = await guestApi.create(newGuest);
      setGuests([guest, ...guests]);
      setNewGuest({ name: '', email: '', password: '', phone: '', organization: '', purpose: '', expiresAt: '' });
      setShowAddForm(false);
      alert('✅ Guest account created successfully!');
    } catch (error) {
      console.error('Error creating guest:', error);
      alert('❌ Failed to create guest: ' + error.message);
    }
  };

  const handleUpdateGuest = async (id, updates) => {
    try {
      const updated = await guestApi.update(id, updates);
      setGuests(guests.map(g => g.id === id ? updated : g));
      setEditingGuest(null);
      alert('✅ Guest updated successfully!');
    } catch (error) {
      console.error('Error updating guest:', error);
      alert('❌ Failed to update guest: ' + error.message);
    }
  };

  const handleToggleActive = async (guest) => {
    try {
      const updated = await guestApi.update(guest.id, { isActive: !guest.isActive });
      setGuests(guests.map(g => g.id === guest.id ? updated : g));
    } catch (error) {
      console.error('Error toggling guest status:', error);
      alert('❌ Failed to update guest status: ' + error.message);
    }
  };

  const handleDeleteGuest = async (id) => {
    if (!confirm('Are you sure you want to delete this guest account?')) return;
    
    try {
      await guestApi.delete(id);
      setGuests(guests.filter(g => g.id !== id));
      alert('✅ Guest deleted successfully!');
    } catch (error) {
      console.error('Error deleting guest:', error);
      alert('❌ Failed to delete guest: ' + error.message);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Guest Accounts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage view-only guest access ({guests.length} guests)
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 magic-gradient text-white px-4 py-2 rounded-xl font-semibold shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>Add Guest</span>
        </motion.button>
      </div>

      {/* Guest List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading guests...</p>
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <UserPlus className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No guest accounts yet</p>
          </div>
        ) : (
          guests.map(guest => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-gray-800 border-2 rounded-xl p-4 ${
                guest.isActive 
                  ? 'border-green-200 dark:border-green-700' 
                  : 'border-red-200 dark:border-red-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{guest.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      guest.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {guest.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Email: <span className="font-medium">{guest.email}</span></span>
                    {guest.phone && <span>Phone: <span className="font-medium">{guest.phone}</span></span>}
                    {guest.organization && <span>Org: <span className="font-medium">{guest.organization}</span></span>}
                    {guest.expiresAt && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Expires: <span className="font-medium">{guest.expiresAt}</span></span>
                      </span>
                    )}
                  </div>
                  {guest.purpose && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Purpose: {guest.purpose}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Created: {guest.createdAt}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleToggleActive(guest)}
                    className={`p-2 rounded-lg transition-colors ${
                      guest.isActive 
                        ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={guest.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {guest.isActive ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingGuest(guest)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Guest Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Add Guest Account
              </h3>

              <form onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="guest@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="text"
                    value={newGuest.password}
                    onChange={(e) => setNewGuest({ ...newGuest, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newGuest.organization}
                    onChange={(e) => setNewGuest({ ...newGuest, organization: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="Company/Organization name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Purpose of Access <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newGuest.purpose}
                    onChange={(e) => setNewGuest({ ...newGuest, purpose: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                    placeholder="e.g., Investor review, Partner demo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Expiry Date <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={newGuest.expiresAt}
                    onChange={(e) => setNewGuest({ ...newGuest, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Guest accounts have view-only access. They cannot add, edit, or delete any data.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 magic-gradient text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Create Guest
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Guest Modal */}
      <AnimatePresence>
        {editingGuest && (
          <EditGuestModal
            guest={editingGuest}
            onClose={() => setEditingGuest(null)}
            onSave={handleUpdateGuest}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Edit Guest Modal Component
function EditGuestModal({ guest, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: guest.name || '',
    email: guest.email || '',
    phone: guest.phone || '',
    organization: guest.organization || '',
    purpose: guest.purpose || '',
    expiresAt: guest.expiresAt || '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = { ...formData };
    if (!updates.password) delete updates.password; // Don't send empty password
    onSave(guest.id, updates);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Edit Guest Account
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Guest Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password (leave blank to keep current)
            </label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purpose <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Access Expiry Date <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 outline-none"
            />
          </div>

          <div className="flex space-x-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 magic-gradient text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
