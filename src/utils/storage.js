// LocalStorage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Export all data as JSON
export const exportData = () => {
  const data = {
    startups: storage.get('startups', []),
    smcSchedules: storage.get('smcSchedules', []),
    oneOnOneSessions: storage.get('oneOnOneSessions', []),
    oneOnOneSchedules: storage.get('oneOnOneSchedules', []),
    darkMode: storage.get('darkMode', false),
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Full-Export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export startups only as JSON
export const exportStartupsJSON = () => {
  const startups = storage.get('startups', []);
  const data = {
    startups,
    exportDate: new Date().toISOString(),
    totalCount: startups.length,
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Startups-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export startups as CSV with enhanced fields
export const exportStartupsCSV = () => {
  const startups = storage.get('startups', []);
  
  if (startups.length === 0) {
    alert('No startups to export');
    return;
  }

  // Define comprehensive CSV headers
  const headers = [
    'Magic Code',
    'Company Name',
    'Founder Name',
    'Email',
    'Mobile',
    'City',
    'Sector',
    'Domain',
    'Stage',
    'Status',
    'Team Size',
    'Is Registered',
    'Stage of Idea',
    'Problem',
    'Solution',
    'Has Patent',
    'Patent Number',
    'Website',
    'Target Customer',
    'Has Paying Customers',
    'Total Revenue',
    'Total Achievements',
    'Onboarded Date',
    'Graduated Date',
    'Agreement Date',
    'Engagement Medium',
    'Registration Date',
    'Created At'
  ];

  // Convert startups to CSV rows with enhanced data
  const rows = startups.map(s => {
    const totalRevenue = s.totalRevenue || (s.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;
    const achievementCount = s.achievements?.length || 0;
    
    return [
      s.magicCode || '',
      s.companyName || '',
      s.founderName || '',
      s.founderEmail || '',
      s.founderMobile || '',
      s.city || '',
      s.sector || '',
      s.domain || '',
      s.stage || '',
      s.status || '',
      s.teamSize || '',
      s.isRegistered || '',
      s.stageOfIdea || '',
      (s.problemSolving || '').replace(/"/g, '""'),
      (s.solution || '').replace(/"/g, '""'),
      s.hasPatent || '',
      s.patentNumber || '',
      s.website || '',
      s.targetCustomer || '',
      s.hasPayingCustomers || '',
      totalRevenue,
      achievementCount,
      s.onboardedDate || '',
      s.graduatedDate || '',
      s.agreementDate || '',
      s.engagementMedium || '',
      s.registrationDate || '',
      s.createdAt || ''
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Startups-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export SMC schedules
export const exportSMCSchedules = () => {
  const schedules = storage.get('smcSchedules', []);
  const startups = storage.get('startups', []);
  
  if (schedules.length === 0) {
    alert('No SMC schedules to export');
    return;
  }

  // Enrich schedules with startup data
  const enrichedSchedules = schedules.map(schedule => {
    const startup = startups.find(s => s.id === schedule.startupId);
    return {
      date: schedule.date,
      timeSlot: schedule.timeSlot,
      status: schedule.status,
      companyName: startup?.companyName || 'Unknown',
      founderName: startup?.founderName || 'Unknown',
      magicCode: startup?.magicCode || '',
      panelistName: schedule.completionData?.panelistName || '',
      feedback: schedule.completionData?.feedback || '',
      scheduledAt: schedule.createdAt
    };
  });

  const data = {
    smcSchedules: enrichedSchedules,
    exportDate: new Date().toISOString(),
    totalCount: schedules.length,
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-SMC-Schedules-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export One-on-One sessions
export const exportOneOnOneSessions = () => {
  const sessions = storage.get('oneOnOneSchedules', []);
  const startups = storage.get('startups', []);
  
  if (sessions.length === 0) {
    alert('No One-on-One sessions to export');
    return;
  }

  // Enrich sessions with startup data
  const enrichedSessions = sessions.map(session => {
    const startup = startups.find(s => s.id === session.startupId);
    return {
      date: session.date,
      time: session.time,
      status: session.status,
      companyName: startup?.companyName || 'Unknown',
      founderName: startup?.founderName || 'Unknown',
      magicCode: startup?.magicCode || '',
      mentorName: session.completionData?.mentorName || '',
      feedback: session.completionData?.feedback || '',
      progress: session.completionData?.progress || '',
      scheduledAt: session.createdAt
    };
  });

  const data = {
    oneOnOneSessions: enrichedSessions,
    exportDate: new Date().toISOString(),
    totalCount: sessions.length,
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-OneOnOne-Sessions-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export by status (Active, Onboarded, Graduated, etc.) - Enhanced
export const exportByStatus = (status) => {
  const startups = storage.get('startups', []).filter(s => s.status === status);
  
  if (startups.length === 0) {
    alert(`No ${status} startups to export`);
    return;
  }

  // Calculate statistics
  const totalRevenue = startups.reduce((sum, s) => {
    const rev = s.totalRevenue || (s.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;
    return sum + rev;
  }, 0);
  
  const totalAchievements = startups.reduce((sum, s) => sum + (s.achievements?.length || 0), 0);

  const data = {
    startups,
    status,
    statistics: {
      totalCount: startups.length,
      totalRevenue,
      totalAchievements,
      averageRevenue: startups.length > 0 ? Math.round(totalRevenue / startups.length) : 0,
      sectors: [...new Set(startups.map(s => s.sector))],
      cities: [...new Set(startups.map(s => s.city))]
    },
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-${status}-Startups-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export by stage
export const exportByStage = (stage) => {
  const startups = storage.get('startups', []).filter(s => s.stage === stage);
  
  if (startups.length === 0) {
    alert(`No startups in ${stage} to export`);
    return;
  }

  const data = {
    startups,
    stage,
    exportDate: new Date().toISOString(),
    totalCount: startups.length,
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-${stage}-Startups-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export summary report
export const exportSummaryReport = () => {
  const startups = storage.get('startups', []);
  const smcSchedules = storage.get('smcSchedules', []);
  const oneOnOneSchedules = storage.get('oneOnOneSchedules', []);

  const summary = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    overview: {
      totalStartups: startups.length,
      activeStartups: startups.filter(s => s.status === 'Active').length,
      onboardedStartups: startups.filter(s => s.status === 'Onboarded').length,
      graduatedStartups: startups.filter(s => s.status === 'Graduated').length,
      rejectedStartups: startups.filter(s => s.status === 'Rejected').length,
      inactiveStartups: startups.filter(s => s.status === 'Inactive').length
    },
    byStage: {
      S0: startups.filter(s => s.stage === 'S0').length,
      S1: startups.filter(s => s.stage === 'S1').length,
      S2: startups.filter(s => s.stage === 'S2').length,
      S3: startups.filter(s => s.stage === 'S3').length,
      'One-on-One': startups.filter(s => s.stage === 'One-on-One').length
    },
    bySector: startups.reduce((acc, s) => {
      acc[s.sector] = (acc[s.sector] || 0) + 1;
      return acc;
    }, {}),
    byCity: startups.reduce((acc, s) => {
      acc[s.city] = (acc[s.city] || 0) + 1;
      return acc;
    }, {}),
    meetings: {
      totalSMCSchedules: smcSchedules.length,
      completedSMC: smcSchedules.filter(s => s.status === 'Completed').length,
      scheduledSMC: smcSchedules.filter(s => s.status === 'Scheduled').length,
      totalOneOnOne: oneOnOneSchedules.length,
      completedOneOnOne: oneOnOneSchedules.filter(s => s.status === 'Completed').length,
      scheduledOneOnOne: oneOnOneSchedules.filter(s => s.status === 'Scheduled').length
    }
  };

  const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Summary-Report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import data
export const importData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.startups) storage.set('startups', data.startups);
      if (data.smcSchedules) storage.set('smcSchedules', data.smcSchedules);
      if (data.oneOnOneSessions) storage.set('oneOnOneSessions', data.oneOnOneSessions);
      if (data.oneOnOneSchedules) storage.set('oneOnOneSchedules', data.oneOnOneSchedules);
      if (typeof data.darkMode !== 'undefined') storage.set('darkMode', data.darkMode);
      callback(true);
    } catch (error) {
      console.error('Error importing data:', error);
      callback(false);
    }
  };
  reader.readAsText(file);
};

// Export by status as CSV
export const exportByStatusCSV = (status) => {
  const startups = storage.get('startups', []).filter(s => s.status === status);
  
  if (startups.length === 0) {
    alert(`No ${status} startups to export`);
    return;
  }

  const headers = [
    'Magic Code', 'Company Name', 'Founder', 'Email', 'Mobile', 'City', 'Sector', 'Domain',
    'Stage', 'Team Size', 'Total Revenue', 'Total Achievements', 'Onboarded Date', 'Graduated Date', 'Created At'
  ];
  
  const rows = startups.map(s => {
    const totalRevenue = s.totalRevenue || (s.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;
    return [
      s.magicCode || '',
      s.companyName || '',
      s.founderName || '',
      s.founderEmail || '',
      s.founderMobile || '',
      s.city || '',
      s.sector || '',
      s.domain || '',
      s.stage || '',
      s.teamSize || '',
      totalRevenue,
      (s.achievements?.length || 0),
      s.onboardedDate || '',
      s.graduatedDate || '',
      s.createdAt || ''
    ];
  });
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-${status}-Startups-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export achievements report
export const exportAchievementsReport = () => {
  const startups = storage.get('startups', []);
  const achievementsData = [];
  
  startups.forEach(startup => {
    if (startup.achievements && startup.achievements.length > 0) {
      startup.achievements.forEach(ach => {
        achievementsData.push({
          magicCode: startup.magicCode,
          companyName: startup.companyName,
          founderName: startup.founderName,
          status: startup.status,
          achievementTitle: ach.title,
          achievementDescription: ach.description,
          achievementDate: ach.date,
          achievementType: ach.type || 'General',
          hasMedia: ach.mediaUrl ? 'Yes' : 'No'
        });
      });
    }
  });
  
  if (achievementsData.length === 0) {
    alert('No achievements to export');
    return;
  }

  const data = {
    achievements: achievementsData,
    totalAchievements: achievementsData.length,
    totalStartupsWithAchievements: new Set(achievementsData.map(a => a.magicCode)).size,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Achievements-Report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export revenue report
export const exportRevenueReport = () => {
  const startups = storage.get('startups', []);
  const revenueData = [];
  
  startups.forEach(startup => {
    if (startup.revenueHistory && startup.revenueHistory.length > 0) {
      startup.revenueHistory.forEach(rev => {
        revenueData.push({
          magicCode: startup.magicCode,
          companyName: startup.companyName,
          founderName: startup.founderName,
          status: startup.status,
          sector: startup.sector,
          amount: rev.amount,
          source: rev.source,
          date: rev.date,
          description: rev.description || ''
        });
      });
    }
  });
  
  if (revenueData.length === 0) {
    alert('No revenue data to export');
    return;
  }

  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0);

  const data = {
    revenueEntries: revenueData,
    totalRevenue,
    totalEntries: revenueData.length,
    totalStartupsWithRevenue: new Set(revenueData.map(r => r.magicCode)).size,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Revenue-Report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export progress tracking report
export const exportProgressReport = () => {
  const startups = storage.get('startups', []).filter(s => s.progressTracking);
  
  if (startups.length === 0) {
    alert('No progress tracking data to export');
    return;
  }

  const progressData = startups.map(s => ({
    magicCode: s.magicCode,
    companyName: s.companyName,
    founderName: s.founderName,
    status: s.status,
    sector: s.sector,
    progressTracking: s.progressTracking
  }));

  const data = {
    startups: progressData,
    totalCount: progressData.length,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-Progress-Report-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
