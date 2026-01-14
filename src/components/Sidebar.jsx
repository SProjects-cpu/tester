import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Rocket, Calendar, Users, Star, XCircle, 
  Settings, LogOut, Moon, Sun, Menu, X, Edit3, DoorOpen,
  ChevronDown, ChevronRight, UserCheck, UserX, Pause, GraduationCap
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, onLogout, darkMode, toggleDarkMode, isGuest = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    smc: false,
    onboard: false
  });

  // Regular menu items (not in dropdowns)
  const regularMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'startups', label: 'All Startups', icon: Rocket },
  ];

  // SMC dropdown group
  const smcGroup = {
    id: 'smc-group',
    label: 'SMC',
    icon: Calendar,
    items: [
      { id: 'smc', label: 'SMC Scheduling', icon: Calendar },
      { id: 'fmc', label: 'FMC Scheduling', icon: Calendar },
      { id: 'oneOnOne', label: 'One on One', icon: Users },
    ]
  };

  // Onboard dropdown group
  const onboardGroup = {
    id: 'onboard-group',
    label: 'Onboard',
    icon: Star,
    items: [
      { id: 'onboarded', label: 'Onboarded', icon: UserCheck },
      { id: 'graduated', label: 'Graduated', icon: GraduationCap },
      { id: 'inactive', label: 'Inactive', icon: Pause },
      { id: 'rejected', label: 'Rejected', icon: XCircle },
      { id: 'quit', label: 'Quit', icon: DoorOpen },
    ]
  };

  // Bottom menu items
  const bottomMenuItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Add Landing Page Editor for admin only
  if (!isGuest) {
    bottomMenuItems.push({ id: 'landingEditor', label: 'Landing Page', icon: Edit3 });
  }

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Check if any item in a group is active
  const isGroupActive = (group) => {
    return group.items.some(item => item.id === currentPage);
  };

  const MenuButton = ({ item, isActive }) => {
    const Icon = item.icon;
    return (
      <motion.button
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigate(item.id)}
        className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
          isActive 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg font-semibold' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium'
        }`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </motion.button>
    );
  };

  const DropdownGroup = ({ group, groupKey }) => {
    const Icon = group.icon;
    const isExpanded = expandedGroups[groupKey];
    const hasActiveItem = isGroupActive(group);

    return (
      <div className="space-y-1">
        <motion.button
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleGroup(groupKey)}
          className={`w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all text-sm sm:text-base ${
            hasActiveItem 
              ? 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 text-gray-900 dark:text-white shadow-sm font-semibold border border-blue-200 dark:border-blue-600' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{group.label}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-600 space-y-1"
            >
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all text-sm ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md font-semibold' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <img 
            src="/magic_logo.png" 
            alt="MAGIC" 
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
          />
          {isGuest && (
            <span className="inline-block px-3 py-1 bg-yellow-400/20 border border-yellow-500/50 rounded-lg text-xs text-yellow-700 dark:text-yellow-300">
              👁️ View Only
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto scrollbar-thin">
        {/* Regular menu items */}
        {regularMenuItems.map((item) => (
          <MenuButton key={item.id} item={item} isActive={currentPage === item.id} />
        ))}

        {/* SMC Dropdown Group */}
        <DropdownGroup group={smcGroup} groupKey="smc" />

        {/* Onboard Dropdown Group */}
        <DropdownGroup group={onboardGroup} groupKey="onboard" />

        {/* Bottom menu items (Settings, etc.) */}
        {bottomMenuItems.map((item) => (
          <MenuButton key={item.id} item={item} isActive={currentPage === item.id} />
        ))}
      </nav>

      <div className="p-3 sm:p-4 space-y-1.5 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-800 dark:text-gray-100 text-sm sm:text-base font-medium"
        >
          {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          <span className="truncate">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-gray-800 dark:text-gray-100 text-sm sm:text-base font-medium"
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
        className="hidden lg:flex w-64 xl:w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-gray-800 dark:text-white flex-col shadow-xl border-r border-gray-200 dark:border-gray-700"
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md text-gray-800 dark:text-white flex-col shadow-xl z-40 border-r border-gray-200 dark:border-gray-700"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
