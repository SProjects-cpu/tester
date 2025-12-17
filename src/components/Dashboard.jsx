import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Users, Star, XCircle, TrendingUp, GraduationCap } from 'lucide-react';
import { storage } from '../utils/storage';
import InactiveStartupNotifications from './InactiveStartupNotifications';

export default function Dashboard({ onNavigate, onNavigateWithSector }) {
  const [stats, setStats] = useState({
    s0: 0, s1: 0, s2: 0, s3: 0,
    oneOnOne: 0, onboarded: 0, graduated: 0, rejected: 0, total: 0
  });
  const [sectorStats, setSectorStats] = useState({});

  useEffect(() => {
    const startups = storage.get('startups', []);
    
    const newStats = {
      s0: startups.filter(s => s.stage === 'S0').length,
      s1: startups.filter(s => s.stage === 'S1').length,
      s2: startups.filter(s => s.stage === 'S2').length,
      s3: startups.filter(s => s.stage === 'S3').length,
      oneOnOne: startups.filter(s => s.stage === 'One-on-One').length,
      onboarded: startups.filter(s => s.status === 'Onboarded').length,
      graduated: startups.filter(s => s.status === 'Graduated').length,
      rejected: startups.filter(s => s.status === 'Rejected').length,
      total: startups.length
    };
    
    // Calculate sector statistics
    const sectors = {};
    startups.forEach(startup => {
      if (startup.sector) {
        sectors[startup.sector] = (sectors[startup.sector] || 0) + 1;
      }
    });
    
    setStats(newStats);
    setSectorStats(sectors);
  }, []);

  const cards = [
    { 
      label: 'S0 - Registered', 
      value: stats.s0, 
      borderColor: 'border-gray-500',
      iconColor: 'text-gray-500',
      icon: Rocket,
      page: 'startups'
    },
    { 
      label: 'S1 - Stage 1', 
      value: stats.s1, 
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'S2 - Stage 2', 
      value: stats.s2, 
      borderColor: 'border-purple-500',
      iconColor: 'text-purple-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'S3 - Stage 3', 
      value: stats.s3, 
      borderColor: 'border-orange-500',
      iconColor: 'text-orange-500',
      icon: TrendingUp,
      page: 'startups'
    },
    { 
      label: 'One-on-One', 
      value: stats.oneOnOne, 
      borderColor: 'border-indigo-500',
      iconColor: 'text-indigo-500',
      icon: Users,
      page: 'oneOnOne'
    },
    { 
      label: 'Onboarded', 
      value: stats.onboarded, 
      borderColor: 'border-green-500',
      iconColor: 'text-green-500',
      icon: Star,
      page: 'onboarded'
    },
    { 
      label: 'Graduated', 
      value: stats.graduated, 
      borderColor: 'border-purple-500',
      iconColor: 'text-purple-500',
      icon: GraduationCap,
      page: 'graduated'
    },
    { 
      label: 'Rejected', 
      value: stats.rejected, 
      borderColor: 'border-red-500',
      iconColor: 'text-red-500',
      icon: XCircle,
      page: 'rejected'
    },
    { 
      label: 'Total Startups', 
      value: stats.total, 
      borderColor: 'border-pink-500',
      iconColor: 'text-pink-500',
      icon: Rocket,
      page: 'startups'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold magic-text-gradient">
            Dashboard
          </h1>
          <p className="text-purple-600 dark:text-purple-400 mt-2 text-sm sm:text-base font-semibold">
            Welcome to MAGIC Startup Incubation Management System
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate('startups')}
          className="magic-gradient text-white px-5 sm:px-6 py-3 rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base font-semibold whitespace-nowrap"
        >
          Register New Startup
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.page)}
              className="cursor-pointer"
            >
              <div className={`bg-green-50 dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all border-b-4 ${card.borderColor}`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${card.iconColor}`} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, type: 'spring' }}
                    className={`text-3xl sm:text-4xl ${card.iconColor}`}
                  >
                    {card.value}
                  </motion.div>
                </div>
                <h3 className="text-base sm:text-lg text-gray-900 dark:text-gray-100">{card.label}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sector Statistics */}
      {Object.keys(sectorStats).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 sm:mt-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold magic-text-gradient mb-6">
            Startups by Sector
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Object.entries(sectorStats)
              .sort((a, b) => b[1] - a[1]) // Sort by count descending
              .map(([sector, count], index) => (
                <motion.div
                  key={sector}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigateWithSector ? onNavigateWithSector('startups', sector) : onNavigate('startups')}
                  className="cursor-pointer bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 shadow-md hover:shadow-xl transition-all border-2 border-cyan-200 dark:border-cyan-700"
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                      {count}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium line-clamp-2">
                      {sector}
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Real-Time Analytics Graphs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-8 sm:mt-12"
      >
        <h2 className="text-2xl sm:text-3xl font-bold magic-text-gradient mb-6 text-center">
          Real-Time Analytics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Startups Registered */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Registered</h3>
              <Rocket className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-4">{stats.total}</div>
            <div className="relative h-32">
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between space-x-1">
                {[stats.s0, stats.s1, stats.s2, stats.s3, stats.oneOnOne].map((value, idx) => {
                  const maxValue = Math.max(stats.s0, stats.s1, stats.s2, stats.s3, stats.oneOnOne, 1);
                  const height = (value / maxValue) * 100;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 1.2 + idx * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg relative group"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {['S0', 'S1', 'S2', 'S3', '1-on-1'][idx]}: {value}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>S0</span>
              <span>S1</span>
              <span>S2</span>
              <span>S3</span>
              <span>1:1</span>
            </div>
          </motion.div>

          {/* Total Onboarded */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Onboarded</h3>
              <Star className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-4xl font-bold text-green-600 mb-4">{stats.onboarded}</div>
            <div className="relative h-32 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  className="text-green-500"
                  initial={{ strokeDasharray: "0 352" }}
                  animate={{ 
                    strokeDasharray: `${(stats.onboarded / (stats.total || 1)) * 352} 352` 
                  }}
                  transition={{ delay: 1.2, duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total > 0 ? Math.round((stats.onboarded / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              {stats.onboarded} out of {stats.total} startups
            </div>
          </motion.div>

          {/* Total Mentored */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Mentored</h3>
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-4">{stats.oneOnOne}</div>
            <div className="space-y-3">
              {[
                { label: 'One-on-One', value: stats.oneOnOne, color: 'bg-purple-500', max: stats.total },
                { label: 'Onboarded', value: stats.onboarded, color: 'bg-green-500', max: stats.total },
                { label: 'Graduated', value: stats.graduated, color: 'bg-pink-500', max: stats.total }
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / (item.max || 1)) * 100}%` }}
                      transition={{ delay: 1.2 + idx * 0.2, duration: 0.8 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Inactive Startup Notifications */}
      <div className="mt-8">
        <InactiveStartupNotifications onNavigate={onNavigate} />
      </div>

    </div>
  );
}
