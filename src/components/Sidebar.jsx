import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Rocket, Calendar, Users, Star, XCircle, 
  Settings, LogOut, Moon, Sun, Menu, X, Edit3, AlertTriangle 
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, onLogout, darkMode, toggleDarkMode, isGuest = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'startups', label: 'All Startups', icon: Rocket },
    { id: 'inactive', label: 'Inactive Startups', icon: AlertTriangle },
    { id: 'smc', label: 'SMC', icon: Calendar },
    { id: 'oneOnOne', label: 'One-on-One', icon: Users },
    { id: 'onboarded', label: 'Onboarded', icon: Star },
    { id: 'graduated', label: 'Graduated', icon: Star },
    { id: 'rejected', label: 'Rejected', icon: XCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Add Landing Page Editor for admin only
  if (!isGuest) {
    menuItems.push({ id: 'landingEditor', label: 'Landing Page', icon: Edit3 });
  }

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-blue-200/30">
        <div className="flex flex-col items-center space-y-3">
          <img 
            src="/magic_icon.png" 
            alt="MAGIC" 
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-2xl"
          />
          {isGuest && (
            <span className="inline-block px-3 py-1 bg-yellow-400/20 border border-yellow-500/50 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
              👁️ View Only
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                  : 'hover:bg-blue-200/50 dark:hover:bg-blue-800/30 text-gray-900 dark:text-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-3 sm:p-4 space-y-1.5 border-t border-blue-200/30 dark:border-blue-800/30">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-blue-200/50 dark:hover:bg-blue-800/30 transition-all text-gray-900 dark:text-gray-100 text-sm sm:text-base"
        >
          {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          <span className="truncate">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all text-gray-900 dark:text-gray-100 text-sm sm:text-base"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">Logout</span>
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="hidden lg:flex w-64 xl:w-72 bg-gradient-to-b from-blue-50/90 to-blue-100/90 dark:from-blue-900/30 dark:to-blue-800/30 backdrop-blur-md text-gray-800 dark:text-white flex-col shadow-2xl border-r border-blue-200 dark:border-blue-800"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-blue-50/95 to-blue-100/95 dark:from-blue-900/30 dark:to-blue-800/30 backdrop-blur-md text-gray-800 dark:text-white flex-col shadow-2xl z-40 border-r border-blue-200 dark:border-blue-800"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
