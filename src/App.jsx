import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MagicBackground from './components/MagicBackground';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AllStartups from './components/AllStartups';
import InactiveStartups from './components/InactiveStartups';
import SMCScheduling from './components/SMCScheduling';
import OneOnOneScheduling from './components/OneOnOneScheduling';
import Onboarded from './components/Onboarded';
import Graduated from './components/Graduated';
import Rejected from './components/Rejected';
import Settings from './components/Settings';
import LandingPageEditor from './components/LandingPageEditor';
import { useAuth } from './hooks/useAuth';
import { storage } from './utils/storage';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sectorFilter, setSectorFilter] = useState(null);
  
  const { user, loading, login, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated) {
      setShowLanding(false);
    }
    
    const savedDarkMode = storage.get('darkMode', false);
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [isAuthenticated]);

  const handleLogin = async (username, password) => {
    const result = await login(username, password);
    if (result.success) {
      setShowLanding(false);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    logout();
    setShowLanding(true);
    setCurrentPage('dashboard');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    storage.set('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <MagicBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </MagicBackground>
    );
  }

  // Show landing page first
  if (showLanding && !isAuthenticated) {
    return <LandingPage onNavigateToLogin={() => setShowLanding(false)} />;
  }

  // Show login page
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} onBack={() => setShowLanding(true)} />;
  }

  const handleNavigateWithSector = (page, sector = null) => {
    setCurrentPage(page);
    setSectorFilter(sector);
  };

  const isGuest = user?.role === 'guest';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} onNavigateWithSector={handleNavigateWithSector} isGuest={isGuest} />;
      case 'startups':
        return <AllStartups isGuest={isGuest} initialSectorFilter={sectorFilter} />;
      case 'inactive':
        return <InactiveStartups isGuest={isGuest} />;
      case 'smc':
        return <SMCScheduling isGuest={isGuest} />;
      case 'oneOnOne':
        return <OneOnOneScheduling isGuest={isGuest} />;
      case 'onboarded':
        return <Onboarded isGuest={isGuest} />;
      case 'graduated':
        return <Graduated isGuest={isGuest} />;
      case 'rejected':
        return <Rejected isGuest={isGuest} />;
      case 'settings':
        return <Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} isGuest={isGuest} />;
      case 'landingEditor':
        return <LandingPageEditor onPreview={() => window.open('/', '_blank')} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} isGuest={isGuest} />;
    }
  };

  return (
    <MagicBackground>
      <div className="flex h-screen transition-colors duration-300 overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          isGuest={isGuest}
          user={user}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-8 min-h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </MagicBackground>
  );
}

export default App;
