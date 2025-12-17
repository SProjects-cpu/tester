import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  TrendingUp, 
  Users, 
  Award, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  Target,
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { storage } from '../utils/storage';
import MagicBackground from './MagicBackground';
import SmokeyCursor from './ui/smokey-cursor';

const LandingPage = ({ onNavigateToLogin }) => {
  const [landingData, setLandingData] = useState(null);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [startupStats, setStartupStats] = useState({
    total: 0,
    registered: 0,
    mentored: 0,
    onboarded: 0,
    graduated: 0
  });

  useEffect(() => {
    // Load landing page data from storage
    const data = storage.get('landingPageData');
    if (data) {
      setLandingData(data);
    }

    // Load real startup statistics
    const startups = storage.get('startups', []);
    const stats = {
      total: startups.length,
      registered: startups.filter(s => s.stage === 'S0').length,
      mentored: startups.filter(s => s.stage === 'One-on-One').length,
      onboarded: startups.filter(s => s.status === 'Onboarded').length,
      graduated: startups.filter(s => s.status === 'Graduated').length
    };
    setStartupStats(stats);

    if (!data) {
      // Load default data
      import('../utils/landingPageData').then(module => {
        setLandingData(module.defaultLandingData);
      });
    }
  }, []);

  useEffect(() => {
    if (landingData?.news?.length > 1) {
      const interval = setInterval(() => {
        setActiveNewsIndex((prev) => (prev + 1) % landingData.news.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [landingData]);

  if (!landingData) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const iconMap = {
    Rocket, TrendingUp, Users, Award, Target, Lightbulb, Sparkles
  };

  return (
    <MagicBackground>
      {/* Smokey Cursor Effect - Light Rainbow Smoke */}
      <SmokeyCursor
        simulationResolution={128}
        dyeResolution={1024}
        densityDissipation={0.98}
        velocityDissipation={0.99}
        splatRadius={0.5}
        splatForce={5000}
        enableShading={true}
        colorUpdateSpeed={10}
      />
      
      <div className="min-h-screen relative z-10">
        {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-[100] backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-purple-100/50 dark:border-purple-800/50 shadow-lg"
        style={{ position: 'relative' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src="/magic_icon.png" 
                alt="MAGIC Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold magic-text-gradient">
                  {landingData.header.title}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {landingData.header.subtitle}
                </p>
              </div>
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToLogin}
              className="magic-gradient text-white px-6 py-3 rounded-full font-semibold shadow-magic hover:shadow-magic-lg transition-all duration-300 flex items-center space-x-2"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center max-w-4xl mx-auto">
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              {landingData.hero.badge}
            </span>
          </motion.div>
          
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white relative z-20"
          >
            {landingData.hero.title}
          </motion.h2>
          
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-white mb-12 leading-relaxed relative z-20"
          >
            {landingData.hero.description}
          </motion.p>
          
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateToLogin}
              className="magic-gradient text-white px-8 py-4 rounded-full font-semibold text-lg shadow-magic hover:shadow-magic-lg transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>{landingData.hero.primaryCTA}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {landingData.stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-800"
            >
              <div className="text-4xl font-bold magic-text-gradient mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Real-Time Analytics Graphs Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Our Impact in Numbers
          </h3>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Real-time insights into our startup ecosystem
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Donut Chart - Startup Distribution */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl"
          >
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Startup Distribution
            </h4>
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Donut segments with real data */}
                {(() => {
                  const total = startupStats.total || 1;
                  const circumference = 2 * Math.PI * 80;
                  const registeredPct = (startupStats.registered / total) * circumference;
                  const mentoredPct = (startupStats.mentored / total) * circumference;
                  const onboardedPct = (startupStats.onboarded / total) * circumference;
                  const graduatedPct = (startupStats.graduated / total) * circumference;
                  
                  let offset = 0;
                  return (
                    <>
                      <motion.circle
                        cx="100" cy="100" r="80" fill="none"
                        stroke="#FF6B6B" strokeWidth="40"
                        strokeDasharray={`${registeredPct} ${circumference}`}
                        strokeDashoffset={offset}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${registeredPct} ${circumference}` }}
                        transition={{ duration: 1.5, delay: 0.2 }}
                      />
                      <motion.circle
                        cx="100" cy="100" r="80" fill="none"
                        stroke="#4ECDC4" strokeWidth="40"
                        strokeDasharray={`${mentoredPct} ${circumference}`}
                        strokeDashoffset={-(offset += registeredPct)}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${mentoredPct} ${circumference}` }}
                        transition={{ duration: 1.5, delay: 0.4 }}
                      />
                      <motion.circle
                        cx="100" cy="100" r="80" fill="none"
                        stroke="#FFE66D" strokeWidth="40"
                        strokeDasharray={`${onboardedPct} ${circumference}`}
                        strokeDashoffset={-(offset += mentoredPct)}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${onboardedPct} ${circumference}` }}
                        transition={{ duration: 1.5, delay: 0.6 }}
                      />
                      <motion.circle
                        cx="100" cy="100" r="80" fill="none"
                        stroke="#A8E6CF" strokeWidth="40"
                        strokeDasharray={`${graduatedPct} ${circumference}`}
                        strokeDashoffset={-(offset += onboardedPct)}
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${graduatedPct} ${circumference}` }}
                        transition={{ duration: 1.5, delay: 0.8 }}
                      />
                    </>
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{startupStats.total}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6B6B]"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Registered</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{startupStats.registered}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#4ECDC4]"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Mentored</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{startupStats.mentored}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFE66D]"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Onboarded</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{startupStats.onboarded}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#A8E6CF]"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Graduated</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{startupStats.graduated}</span>
              </div>
            </div>
          </motion.div>

          {/* Bar Chart - Growth Metrics */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl"
          >
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Monthly Growth
            </h4>
            <div className="h-48 flex items-end justify-between space-x-3 mb-4">
              {[65, 78, 85, 92, 88, 95].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 via-pink-500 to-orange-400 relative group"
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {height}%
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">↑ 45%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Growth This Quarter</div>
              </div>
            </div>
          </motion.div>

          {/* Circular Progress - Success Rate */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl"
          >
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Success Metrics
            </h4>
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="16"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 502" }}
                  whileInView={{ strokeDasharray: "477 502" }}
                  transition={{ duration: 2, delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent"
                  >
                    95%
                  </motion.div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Funding Secured', value: 92, color: 'from-green-400 to-emerald-500' },
                { label: 'Market Ready', value: 88, color: 'from-blue-400 to-cyan-500' },
                { label: 'Revenue Growth', value: 95, color: 'from-purple-400 to-pink-500' }
              ].map((metric, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{metric.label}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.value}%` }}
                      transition={{ duration: 1.5, delay: 0.5 + idx * 0.2 }}
                      className={`h-full bg-gradient-to-r ${metric.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-16 relative z-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Why Choose MAGIC?
          </h3>
          <p className="text-xl text-white max-w-2xl mx-auto">
            Comprehensive support for your startup journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {landingData.features.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 dark:border-purple-800 group"
              >
                <div className="w-16 h-16 magic-gradient rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* News & Updates Section */}
      {landingData.news.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
        >
          <motion.div variants={itemVariants} className="text-center mb-16 relative z-20">
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Latest News & Updates
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {landingData.news.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 dark:border-purple-800"
              >
                <div className="magic-gradient h-2"></div>
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{item.date}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Contact Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={itemVariants}>
              <h3 className="text-4xl font-bold text-white mb-6">
                Get In Touch
              </h3>
              <p className="text-purple-100 text-lg mb-8">
                Ready to transform your startup idea into reality? Contact us today!
              </p>
              
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-4 text-white"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-purple-100">{landingData.contact.email}</div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-4 text-white"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Phone</div>
                    <div className="text-purple-100">{landingData.contact.phone}</div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-4 text-white"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Address</div>
                    <div className="text-purple-100">{landingData.contact.address}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNavigateToLogin}
                className="bg-white text-purple-600 px-12 py-6 rounded-full font-bold text-xl shadow-2xl hover:shadow-magic-lg transition-all duration-300"
              >
                Join MAGIC Today
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900/80 backdrop-blur-sm text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/magic_icon.png" 
                alt="MAGIC Logo" 
                className="h-10 w-10 object-contain"
              />
              <div>
                <div className="font-bold text-lg">{landingData.footer.title}</div>
                <div className="text-sm text-gray-400">{landingData.footer.tagline}</div>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                {landingData.footer.copyright}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {landingData.footer.description}
              </p>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </MagicBackground>
  );
};

export default LandingPage;
