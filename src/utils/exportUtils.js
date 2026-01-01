import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storage } from './storage';

// ==================== DATE FILTERING UTILITIES ====================

/**
 * Filter data by date range
 * @param {Array} data - Array of objects to filter
 * @param {string} dateField - The field name containing the date to filter by
 * @param {string|null} fromDate - Start date (ISO format) or null
 * @param {string|null} toDate - End date (ISO format) or null
 * @returns {Array} Filtered array
 */
export const filterByDateRange = (data, dateField, fromDate, toDate) => {
  if (!data || !Array.isArray(data)) return [];
  if (!fromDate && !toDate) return data;
  
  return data.filter(item => {
    // Try multiple field names for flexibility
    let dateValue = item[dateField];
    
    // If the primary field is empty, try alternative field names
    if (!dateValue) {
      if (dateField === 'registeredDate') {
        dateValue = item.date || item.registrationDate;
      } else if (dateField === 'registrationDate') {
        dateValue = item.registeredDate || item.date;
      } else if (dateField === 'onboardedDate') {
        dateValue = item.createdAt; // fallback to createdAt if onboardedDate is missing
      }
    }
    
    if (!dateValue) return false;
    
    // Handle both Date objects and ISO strings
    const itemDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(itemDate.getTime())) return false;
    
    // Check fromDate constraint
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (itemDate < from) return false;
    }
    
    // Check toDate constraint (include full day)
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (itemDate > to) return false;
    }
    
    return true;
  });
};

/**
 * Generate export filename with date range
 * @param {string} baseName - Base name for the file (e.g., "All-Startups")
 * @param {string|null} fromDate - Start date (ISO format) or null
 * @param {string|null} toDate - End date (ISO format) or null
 * @returns {string} Generated filename without extension
 */
export const generateExportFileName = (baseName, fromDate, toDate) => {
  const formatDateForFilename = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  let fileName = `MAGIC-${baseName}`;
  
  if (fromDate || toDate) {
    fileName += '-';
    if (fromDate) fileName += formatDateForFilename(fromDate);
    if (fromDate && toDate) fileName += '-to-';
    else if (toDate) fileName += 'to-';
    if (toDate) fileName += formatDateForFilename(toDate);
  }
  
  fileName += `-${new Date().toISOString().split('T')[0]}`;
  return fileName;
};

/**
 * Format date range for display in reports
 * @param {string|null} fromDate - Start date (ISO format) or null
 * @param {string|null} toDate - End date (ISO format) or null
 * @returns {string} Formatted date range string
 */
export const formatDateRangeDisplay = (fromDate, toDate) => {
  const formatDateDisplay = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };
  
  if (!fromDate && !toDate) return '';
  if (fromDate && toDate) return `${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`;
  if (fromDate) return `From ${formatDateDisplay(fromDate)}`;
  if (toDate) return `Until ${formatDateDisplay(toDate)}`;
  return '';
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to escape CSV values
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ==================== PDF EXPORTS ====================

export const exportStartupsToPDF = (startups, title = 'Startups Report', fromDate = null, toDate = null) => {
  if (!startups || startups.length === 0) {
    alert('No startups to export');
    return;
  }

  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Helper function to safely get field value
    const getField = (obj, ...fields) => {
      for (const field of fields) {
        if (obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
          return obj[field];
        }
      }
      return '';
    };
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(title, 14, 15);
    
    // Add metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    doc.text(`Total Startups: ${startups.length}`, 14, 27);
    
    // Add date range if specified
    const dateRangeText = formatDateRangeDisplay(fromDate, toDate);
    let tableStartY = 32;
    if (dateRangeText) {
      doc.text(`Date Range: ${dateRangeText}`, 14, 32);
      tableStartY = 37;
    }
    
    // Determine if this is Onboarded/Graduated export (includes more data)
    const isOnboardedOrGraduated = title.toLowerCase().includes('onboarded') || title.toLowerCase().includes('graduated');
    
    // Prepare table data - handle both field name variations
    const tableData = startups.map(s => {
      const totalRevenue = s.totalRevenue || s.revenueGenerated || (s.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0)) || (s.revenueEntries?.reduce((sum, r) => sum + (r.amount || 0), 0)) || 0;
      const progressCount = s.progressHistory?.length || 0;
      
      const baseData = [
        getField(s, 'magicCode'),
        getField(s, 'companyName', 'name'),
        getField(s, 'founderName', 'founder'),
        getField(s, 'city'),
        getField(s, 'sector'),
        getField(s, 'stage'),
        getField(s, 'status'),
        (s.achievements?.length || 0),
        totalRevenue > 0 ? `₹${totalRevenue.toLocaleString()}` : '₹0'
      ];
      
      // Add extra columns for Onboarded/Graduated
      if (isOnboardedOrGraduated) {
        baseData.push(progressCount);
        baseData.push(s.onboardedDate ? formatDate(s.onboardedDate) : 'N/A');
        if (title.toLowerCase().includes('graduated')) {
          baseData.push(s.graduatedDate ? formatDate(s.graduatedDate) : 'N/A');
        }
      }
      
      return baseData;
    });
    
    // Define headers based on export type
    let headers = ['Magic Code', 'Company', 'Founder', 'City', 'Sector', 'Stage', 'Status', 'Achievements', 'Revenue'];
    let columnStyles = {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 30 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 25, halign: 'right' }
    };
    
    if (isOnboardedOrGraduated) {
      headers.push('Progress');
      headers.push('Onboarded');
      columnStyles[9] = { cellWidth: 15, halign: 'center' };
      columnStyles[10] = { cellWidth: 22 };
      
      if (title.toLowerCase().includes('graduated')) {
        headers.push('Graduated');
        columnStyles[11] = { cellWidth: 22 };
      }
    }
    
    // Add table
    autoTable(doc, {
      startY: tableStartY,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles
    });
    
    // Save PDF
    doc.save(`MAGIC-${title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportDetailedStartupPDF = (startup) => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Helper function to safely get field value (handles both field name variations)
    const getField = (obj, ...fields) => {
      for (const field of fields) {
        if (obj && obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
          return obj[field];
        }
      }
      return 'N/A';
    };
    
    // Title - handle both companyName and name
    const companyName = getField(startup, 'companyName', 'name');
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text(companyName !== 'N/A' ? companyName : 'Startup Details', 14, yPos);
    yPos += 10;
    
    // Magic Code
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Magic Code: ${getField(startup, 'magicCode')}`, 14, yPos);
    yPos += 8;
    
    // Basic Information
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Basic Information', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    const basicInfo = [
      `Founder: ${getField(startup, 'founderName', 'founder')}`,
      `Email: ${getField(startup, 'founderEmail', 'email')}`,
      `Mobile: ${getField(startup, 'founderMobile', 'phone')}`,
      `City: ${getField(startup, 'city')}`,
      `Sector: ${getField(startup, 'sector')}`,
      `Domain: ${getField(startup, 'domain')}`,
      `Stage: ${getField(startup, 'stage')}`,
      `Status: ${getField(startup, 'status')}`,
      `Team Size: ${getField(startup, 'teamSize')}`
    ];
    
    basicInfo.forEach(info => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(info, 14, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    
    // Problem & Solution
    const problem = getField(startup, 'problemSolving', 'problem');
    const solution = getField(startup, 'solution');
    
    if (problem !== 'N/A' || solution !== 'N/A') {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Problem & Solution', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      
      if (problem !== 'N/A') {
        doc.text('Problem:', 14, yPos);
        yPos += 6;
        const problemLines = doc.splitTextToSize(problem, 180);
        doc.text(problemLines, 14, yPos);
        yPos += problemLines.length * 5 + 5;
      }
      
      if (solution !== 'N/A') {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.text('Solution:', 14, yPos);
        yPos += 6;
        const solutionLines = doc.splitTextToSize(solution, 180);
        doc.text(solutionLines, 14, yPos);
        yPos += solutionLines.length * 5 + 5;
      }
    }
  
  // Achievements
  if (startup.achievements && startup.achievements.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Achievements', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    startup.achievements.forEach((ach, idx) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setTextColor(79, 70, 229);
      doc.text(`${idx + 1}. ${ach.title}`, 14, yPos);
      yPos += 6;
      doc.setTextColor(60);
      if (ach.description) {
        const descLines = doc.splitTextToSize(ach.description, 180);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5 + 3;
      }
      if (ach.date) {
        doc.text(`Date: ${formatDate(ach.date)}`, 20, yPos);
        yPos += 6;
      }
      yPos += 3;
    });
  }
  
  // Revenue History
  if (startup.revenueHistory && startup.revenueHistory.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text('Revenue History', 14, yPos);
    yPos += 8;
    
    const totalRevenue = startup.revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, yPos);
    yPos += 8;
    
    const revenueData = startup.revenueHistory.map(r => [
      formatDate(r.date),
      r.source || '',
      `₹${(r.amount || 0).toLocaleString()}`,
      r.description || ''
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Source', 'Amount', 'Description']],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });
  }
  
  // Save PDF
    const fileName = getField(startup, 'companyName', 'name');
    doc.save(`MAGIC-${fileName !== 'N/A' ? fileName.replace(/\s+/g, '-') : 'Startup'}-Details-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting detailed PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportSMCSchedulesToPDF = (schedules = null, startups = null, fromDate = null, toDate = null) => {
  // Try to get data from parameters first, then fallback to localStorage
  const smcData = schedules || storage.get('smcSchedules', []);
  const startupsData = startups || storage.get('startups', []);
  
  if (smcData.length === 0) {
    alert('No SMC schedules to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('SMC Schedules Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    
    // Count completed vs scheduled
    const completedCount = smcData.filter(s => s.status === 'Completed').length;
    const scheduledCount = smcData.filter(s => s.status === 'Scheduled').length;
    doc.text(`Total: ${smcData.length} | Completed: ${completedCount} | Scheduled: ${scheduledCount}`, 14, 27);
    
    // Add date range if specified
    const dateRangeText = formatDateRangeDisplay(fromDate, toDate);
    let tableStartY = 32;
    if (dateRangeText) {
      doc.text(`Date Range: ${dateRangeText}`, 14, 32);
      tableStartY = 37;
    }
    
    const tableData = smcData.map(schedule => {
      const startup = startupsData.find(s => s.id === schedule.startupId);
      const stageProgression = startup?.stage || 'N/A';
      return [
        formatDate(schedule.date),
        schedule.timeSlot || schedule.time || '',
        startup?.name || startup?.companyName || 'Unknown',
        startup?.magicCode || '',
        stageProgression,
        schedule.status || '',
        schedule.completionData?.panelistName || schedule.attendees || '',
        (schedule.completionData?.feedback || schedule.agenda || '').substring(0, 80)
      ];
    });
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Time', 'Company', 'Magic Code', 'Stage', 'Status', 'Panelist', 'Feedback']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        7: { cellWidth: 60 } // Wider column for feedback
      }
    });
    
    const fileName = generateExportFileName('SMC-Schedules', fromDate, toDate);
    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting SMC PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportFMCSchedulesToPDF = (schedules = null, startups = null, fromDate = null, toDate = null) => {
  // Try to get data from parameters first, then fallback to localStorage
  const fmcData = schedules || storage.get('fmcSchedules', []);
  const startupsData = startups || storage.get('startups', []);
  
  if (fmcData.length === 0) {
    alert('No FMC schedules to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('FMC Schedules Report (Friday Mentorship Clinic)', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    
    // Count completed vs scheduled
    const completedCount = fmcData.filter(s => s.status === 'Completed').length;
    const scheduledCount = fmcData.filter(s => s.status === 'Scheduled').length;
    doc.text(`Total: ${fmcData.length} | Completed: ${completedCount} | Scheduled: ${scheduledCount}`, 14, 27);
    
    // Add date range if specified
    const dateRangeText = formatDateRangeDisplay(fromDate, toDate);
    let tableStartY = 32;
    if (dateRangeText) {
      doc.text(`Date Range: ${dateRangeText}`, 14, 32);
      tableStartY = 37;
    }
    
    const tableData = fmcData.map(schedule => {
      const startup = startupsData.find(s => s.id === schedule.startupId);
      const stageProgression = startup?.stage || 'N/A';
      return [
        formatDate(schedule.date),
        schedule.timeSlot || schedule.time || '',
        startup?.name || startup?.companyName || 'Unknown',
        startup?.magicCode || '',
        stageProgression,
        schedule.status || '',
        schedule.completionData?.panelistName || schedule.attendees || '',
        (schedule.completionData?.feedback || schedule.agenda || '').substring(0, 80)
      ];
    });
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Time', 'Company', 'Magic Code', 'Stage', 'Status', 'Panelist', 'Feedback']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Green color for FMC
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        7: { cellWidth: 60 } // Wider column for feedback
      }
    });
    
    const fileName = generateExportFileName('FMC-Schedules', fromDate, toDate);
    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting FMC PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportOneOnOneSessionsToPDF = (sessions = null, startups = null, fromDate = null, toDate = null) => {
  // Try to get data from parameters first, then fallback to localStorage
  const sessionsData = sessions || storage.get('oneOnOneSchedules', []);
  const startupsData = startups || storage.get('startups', []);
  
  if (sessionsData.length === 0) {
    alert('No One-on-One sessions to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('One-on-One Sessions Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    
    // Count completed vs scheduled
    const completedCount = sessionsData.filter(s => s.status === 'Completed').length;
    const scheduledCount = sessionsData.filter(s => s.status === 'Scheduled').length;
    doc.text(`Total: ${sessionsData.length} | Completed: ${completedCount} | Scheduled: ${scheduledCount}`, 14, 27);
    
    // Add date range if specified
    const dateRangeText = formatDateRangeDisplay(fromDate, toDate);
    let tableStartY = 32;
    if (dateRangeText) {
      doc.text(`Date Range: ${dateRangeText}`, 14, 32);
      tableStartY = 37;
    }
    
    const tableData = sessionsData.map(session => {
      const startup = startupsData.find(s => s.id === session.startupId);
      return [
        formatDate(session.date),
        session.time || '',
        startup?.name || startup?.companyName || 'Unknown',
        startup?.magicCode || '',
        session.status || '',
        session.completionData?.mentorName || session.mentor || '',
        (session.completionData?.progress || session.topic || '').substring(0, 40),
        (session.completionData?.feedback || '').substring(0, 60)
      ];
    });
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Time', 'Company', 'Magic Code', 'Status', 'Mentor', 'Progress', 'Feedback']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        6: { cellWidth: 35 },
        7: { cellWidth: 50 }
      }
    });
    
    const fileName = generateExportFileName('OneOnOne-Sessions', fromDate, toDate);
    doc.save(`${fileName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting One-on-One PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportAchievementsToPDF = (startups = null) => {
  // Try to get data from parameters first, then fallback to localStorage
  const startupsData = startups || storage.get('startups', []);
  const achievementsData = [];
  
  startupsData.forEach(startup => {
    if (startup.achievements && startup.achievements.length > 0) {
      startup.achievements.forEach(ach => {
        achievementsData.push({
          company: startup.name || startup.companyName,
          magicCode: startup.magicCode,
          title: ach.title,
          description: ach.description,
          date: ach.date,
          type: ach.type || 'General'
        });
      });
    }
  });
  
  if (achievementsData.length === 0) {
    alert('No achievements to export');
    return;
  }
  
  try {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Achievements Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    doc.text(`Total Achievements: ${achievementsData.length}`, 14, 27);
    
    const tableData = achievementsData.map(ach => [
      ach.magicCode || '',
      ach.company || '',
      ach.title || '',
      ach.type || '',
      formatDate(ach.date),
      (ach.description || '').substring(0, 60)
    ]);
    
    autoTable(doc, {
      startY: 32,
      head: [['Magic Code', 'Company', 'Achievement', 'Type', 'Date', 'Description']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [234, 179, 8] },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    
    doc.save(`MAGIC-Achievements-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting Achievements PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

export const exportRevenueToPDF = (startups = null) => {
  // Try to get data from parameters first, then fallback to localStorage
  const startupsData = startups || storage.get('startups', []);
  const revenueData = [];
  
  startupsData.forEach(startup => {
    // Check for revenueGenerated field (database) or revenueHistory (localStorage)
    const revenue = startup.revenueGenerated || 0;
    if (revenue > 0) {
      revenueData.push({
        company: startup.name || startup.companyName,
        magicCode: startup.magicCode,
        sector: startup.sector,
        amount: revenue,
        source: 'Total Revenue',
        date: startup.onboardedDate || new Date()
      });
    }
    
    // Also check revenueHistory if it exists
    if (startup.revenueHistory && startup.revenueHistory.length > 0) {
      startup.revenueHistory.forEach(rev => {
        revenueData.push({
          company: startup.name || startup.companyName,
          magicCode: startup.magicCode,
          sector: startup.sector,
          amount: rev.amount,
          source: rev.source,
          date: rev.date
        });
      });
    }
  });
  
  if (revenueData.length === 0) {
    alert('No revenue data to export');
    return;
  }
  
  try {
    const totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0);
    
    const doc = new jsPDF('l', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Revenue Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${formatDate(new Date())}`, 14, 22);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, 27);
    doc.text(`Total Entries: ${revenueData.length}`, 14, 32);
    
    const tableData = revenueData.map(rev => [
      rev.magicCode || '',
      rev.company || '',
      rev.sector || '',
      formatDate(rev.date),
      rev.source || '',
      `₹${(rev.amount || 0).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: 37,
      head: [['Magic Code', 'Company', 'Sector', 'Date', 'Source', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        5: { halign: 'right' }
      }
    });
    
    doc.save(`MAGIC-Revenue-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting Revenue PDF:', error);
    alert('Error exporting PDF. Please try again.');
    return false;
  }
};

// ==================== CSV/EXCEL EXPORTS ====================

export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => escapeCSV(cell)).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data, headers, filename) => {
  // Excel format is essentially CSV with .xlsx extension
  // For true Excel format, we'd need a library like xlsx
  // This creates a CSV that Excel can open
  exportToCSV(data, headers, filename);
};

// ==================== JSON EXPORTS ====================

export const exportToJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// ==================== COMPREHENSIVE EXPORT FUNCTION ====================

export const exportStartupsComprehensive = (startups, format, title = 'Startups', fromDate = null, toDate = null) => {
  if (!startups || startups.length === 0) {
    alert('No startups to export');
    return;
  }
  
  const dateRangeText = formatDateRangeDisplay(fromDate, toDate);
  
  switch (format) {
    case 'pdf':
      exportStartupsToPDF(startups, title, fromDate, toDate);
      break;
    case 'json':
      exportToJSON({
        startups,
        exportDate: new Date().toISOString(),
        totalCount: startups.length,
        dateRange: dateRangeText || 'All dates',
        fromDate: fromDate || null,
        toDate: toDate || null,
        version: '1.0.0'
      }, `MAGIC-${title}`);
      break;
    case 'csv':
    case 'excel':
      const headers = [
        'Magic Code', 'Company Name', 'Founder', 'Email', 'Mobile', 'City', 'Sector', 
        'Domain', 'Stage', 'Status', 'Team Size', 'Total Revenue', 'Total Achievements',
        'Onboarded Date', 'Graduated Date'
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
          s.status || '',
          s.teamSize || '',
          totalRevenue,
          (s.achievements?.length || 0),
          s.onboardedDate || '',
          s.graduatedDate || ''
        ];
      });
      exportToCSV(rows, headers, `MAGIC-${title}`);
      break;
    default:
      alert('Invalid export format');
  }
};
