import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { storage } from './storage';
import { getField } from './startupFieldHelper';

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Generate comprehensive startup report with all details
export const generateStartupReport = (startup) => {
  const doc = new jsPDF();
  let yPos = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Title Page
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.text('STARTUP COMPREHENSIVE REPORT', 105, yPos, { align: 'center' });
  yPos += 15;

  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(getField(startup, 'companyName') || 'Startup Report', 105, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Magic Code: ${getField(startup, 'magicCode') || 'N/A'}`, 105, yPos, { align: 'center' });
  yPos += 8;

  doc.text(`Generated: ${formatDate(new Date())}`, 105, yPos, { align: 'center' });
  yPos += 20;

  // === BASIC INFORMATION ===
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  doc.text('BASIC INFORMATION', 14, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(60);
  const basicInfo = [
    ['Company Name', getField(startup, 'companyName') || 'N/A'],
    ['Founder Name', getField(startup, 'founderName') || 'N/A'],
    ['Email', getField(startup, 'founderEmail') || 'N/A'],
    ['Mobile', getField(startup, 'founderMobile') || 'N/A'],
    ['City', getField(startup, 'city') || 'N/A'],
    ['Sector', getField(startup, 'sector') || 'N/A'],
    ['Domain', getField(startup, 'domain') || 'N/A'],
    ['Stage', startup.stage || 'N/A'],
    ['Status', startup.status || 'N/A'],
    ['Team Size', getField(startup, 'teamSize') || 'N/A']
  ];

  basicInfo.forEach(([label, value]) => {
    checkPageBreak();
    doc.setTextColor(100);
    doc.text(`${label}:`, 14, yPos);
    doc.setTextColor(40);
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  yPos += 5;

  // === PROBLEM & SOLUTION ===
  const problemText = getField(startup, 'problemSolving');
  const solutionText = getField(startup, 'solution');
  
  if (problemText || solutionText) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('PROBLEM & SOLUTION', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    if (problemText) {
      doc.setTextColor(100);
      doc.text('Problem:', 14, yPos);
      yPos += 6;
      doc.setTextColor(40);
      const problemLines = doc.splitTextToSize(problemText, 180);
      problemLines.forEach(line => {
        checkPageBreak();
        doc.text(line, 14, yPos);
        yPos += 5;
      });
      yPos += 3;
    }

    if (solutionText) {
      checkPageBreak(10);
      doc.setTextColor(100);
      doc.text('Solution:', 14, yPos);
      yPos += 6;
      doc.setTextColor(40);
      const solutionLines = doc.splitTextToSize(solutionText, 180);
      solutionLines.forEach(line => {
        checkPageBreak();
        doc.text(line, 14, yPos);
        yPos += 5;
      });
      yPos += 5;
    }
  }

  // === ACHIEVEMENTS ===
  if (startup.achievements && startup.achievements.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('ACHIEVEMENTS', 14, yPos);
    yPos += 10;

    startup.achievements.forEach((ach, idx) => {
      checkPageBreak(20);
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(`${idx + 1}. ${ach.title}`, 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setTextColor(60);
      if (ach.description) {
        const descLines = doc.splitTextToSize(ach.description, 180);
        descLines.forEach(line => {
          checkPageBreak();
          doc.text(line, 20, yPos);
          yPos += 5;
        });
      }
      if (ach.date) {
        checkPageBreak();
        doc.text(`Date: ${formatDate(ach.date)}`, 20, yPos);
        yPos += 5;
      }
      if (ach.type) {
        checkPageBreak();
        doc.text(`Type: ${ach.type}`, 20, yPos);
        yPos += 5;
      }
      yPos += 3;
    });
    yPos += 5;
  }

  // === REVENUE HISTORY ===
  if (startup.revenueHistory && startup.revenueHistory.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('REVENUE HISTORY', 14, yPos);
    yPos += 10;

    const totalRevenue = startup.revenueHistory.reduce((sum, r) => sum + (r.amount || 0), 0);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 14, yPos);
    yPos += 10;

    const revenueData = startup.revenueHistory.map(r => [
      formatDate(r.date),
      r.source || '',
      `₹${(r.amount || 0).toLocaleString()}`,
      (r.description || '').substring(0, 40)
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Source', 'Amount', 'Description']],
      body: revenueData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 9 }
    });
    yPos = doc.lastAutoTable.finalY + 10;
  }

  // === PROGRESS TRACKING ===
  if (startup.progressTracking) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('PROGRESS TRACKING', 14, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(60);
    const progress = startup.progressTracking;
    const progressData = [];

    if (progress.proofOfConcept) progressData.push(['Proof of Concept', progress.proofOfConcept]);
    if (progress.prototypeDevelopment) progressData.push(['Prototype Development', progress.prototypeDevelopment]);
    if (progress.productDevelopment) progressData.push(['Product Development', progress.productDevelopment]);
    if (progress.fieldTrials) progressData.push(['Field Trials', progress.fieldTrials]);
    if (progress.marketLaunch) progressData.push(['Market Launch', progress.marketLaunch]);
    if (progress.numberOfEmployees) progressData.push(['Employees', progress.numberOfEmployees]);
    if (progress.ipRegistrations) progressData.push(['IP Registrations', progress.ipRegistrations]);
    if (progress.gemPortalProducts) progressData.push(['GEM Portal Products', progress.gemPortalProducts]);
    if (progress.loans) progressData.push(['Loans', `₹${Number(progress.loans).toLocaleString()}`]);
    if (progress.angelFunding) progressData.push(['Angel Funding', `₹${Number(progress.angelFunding).toLocaleString()}`]);
    if (progress.vcFunding) progressData.push(['VC Funding', `₹${Number(progress.vcFunding).toLocaleString()}`]);

    if (progressData.length > 0) {
      doc.autoTable({
        startY: yPos,
        body: progressData,
        theme: 'plain',
        styles: { fontSize: 9 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 120 }
        }
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
  }

  // === MEETINGS & SESSIONS ===
  const smcSchedules = storage.get('smcSchedules', []).filter(s => s.startupId === startup.id && s.status === 'Completed');
  const oneOnOneSchedules = storage.get('oneOnOneSchedules', []).filter(s => s.startupId === startup.id && s.status === 'Completed');

  if (smcSchedules.length > 0 || oneOnOneSchedules.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('MEETINGS & SESSIONS', 14, yPos);
    yPos += 10;

    if (smcSchedules.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text(`SMC Meetings (${smcSchedules.length})`, 14, yPos);
      yPos += 8;

      smcSchedules.forEach((meeting, idx) => {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setTextColor(40);
        doc.text(`${idx + 1}. ${formatDate(meeting.date)} - ${meeting.timeSlot || 'N/A'}`, 20, yPos);
        yPos += 5;
        if (meeting.completionData?.panelistName) {
          doc.text(`   Panelist: ${meeting.completionData.panelistName}`, 20, yPos);
          yPos += 5;
        }
        if (meeting.completionData?.feedback) {
          const feedbackLines = doc.splitTextToSize(`   Feedback: ${meeting.completionData.feedback}`, 170);
          feedbackLines.forEach(line => {
            checkPageBreak();
            doc.text(line, 20, yPos);
            yPos += 5;
          });
        }
        yPos += 3;
      });
      yPos += 5;
    }

    if (oneOnOneSchedules.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setTextColor(60);
      doc.text(`One-on-One Sessions (${oneOnOneSchedules.length})`, 14, yPos);
      yPos += 8;

      oneOnOneSchedules.forEach((session, idx) => {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setTextColor(40);
        doc.text(`${idx + 1}. ${formatDate(session.date)} - ${session.time || 'N/A'}`, 20, yPos);
        yPos += 5;
        if (session.completionData?.mentorName) {
          doc.text(`   Mentor: ${session.completionData.mentorName}`, 20, yPos);
          yPos += 5;
        }
        if (session.completionData?.feedback) {
          const feedbackLines = doc.splitTextToSize(`   Feedback: ${session.completionData.feedback}`, 170);
          feedbackLines.forEach(line => {
            checkPageBreak();
            doc.text(line, 20, yPos);
            yPos += 5;
          });
        }
        yPos += 3;
      });
    }
  }

  // === EDIT HISTORY ===
  if (startup.editHistory && startup.editHistory.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text('EDIT HISTORY', 14, yPos);
    yPos += 10;

    doc.setFontSize(9);
    startup.editHistory.slice(-10).forEach((edit, idx) => {
      checkPageBreak(10);
      doc.setTextColor(60);
      doc.text(`${formatDate(edit.timestamp)} - ${edit.field}: ${edit.oldValue} → ${edit.newValue}`, 14, yPos);
      yPos += 5;
    });
  }

  // Save PDF
  const companyName = getField(startup, 'companyName') || 'Startup';
  doc.save(`MAGIC-${companyName.replace(/\s+/g, '-')}-Comprehensive-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Generate Word document (HTML-based)
export const generateStartupReportWord = (startup) => {
  const totalRevenue = startup.revenueHistory?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const smcSchedules = storage.get('smcSchedules', []).filter(s => s.startupId === startup.id && s.status === 'Completed');
  const oneOnOneSchedules = storage.get('oneOnOneSchedules', []).filter(s => s.startupId === startup.id && s.status === 'Completed');
  
  const companyName = getField(startup, 'companyName') || 'Startup';
  const founderName = getField(startup, 'founderName') || 'N/A';
  const founderEmail = getField(startup, 'founderEmail') || 'N/A';
  const founderMobile = getField(startup, 'founderMobile') || 'N/A';
  const city = getField(startup, 'city') || 'N/A';
  const sector = getField(startup, 'sector') || 'N/A';
  const domain = getField(startup, 'domain') || 'N/A';
  const teamSize = getField(startup, 'teamSize') || 'N/A';
  const magicCode = getField(startup, 'magicCode') || 'N/A';
  const problemText = getField(startup, 'problemSolving') || '';
  const solutionText = getField(startup, 'solution') || '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${companyName} - Comprehensive Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
    h1 { color: #4F46E5; text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 10px; }
    h2 { color: #4F46E5; margin-top: 30px; border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; }
    h3 { color: #6366F1; margin-top: 20px; }
    .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 10px; margin: 20px 0; }
    .info-label { font-weight: bold; color: #6B7280; }
    .info-value { color: #111827; }
    .achievement { background: #EEF2FF; padding: 15px; margin: 10px 0; border-left: 4px solid #4F46E5; }
    .revenue-item { background: #ECFDF5; padding: 10px; margin: 5px 0; border-left: 4px solid #10B981; }
    .meeting { background: #F3F4F6; padding: 10px; margin: 5px 0; border-left: 4px solid #6366F1; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
    th { background: #4F46E5; color: white; }
    .stat-box { display: inline-block; background: #EEF2FF; padding: 15px 25px; margin: 10px; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
    .stat-label { font-size: 12px; color: #6B7280; }
  </style>
</head>
<body>
  <h1>STARTUP COMPREHENSIVE REPORT</h1>
  <h2 style="text-align: center; color: #111827;">${companyName}</h2>
  <p style="text-align: center; color: #6B7280;">Magic Code: ${magicCode} | Generated: ${formatDate(new Date())}</p>

  <div style="text-align: center; margin: 30px 0;">
    <div class="stat-box">
      <div class="stat-value">₹${totalRevenue.toLocaleString()}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${startup.achievements?.length || 0}</div>
      <div class="stat-label">Achievements</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${smcSchedules.length + oneOnOneSchedules.length}</div>
      <div class="stat-label">Total Meetings</div>
    </div>
  </div>

  <h2>BASIC INFORMATION</h2>
  <div class="info-grid">
    <div class="info-label">Company Name:</div><div class="info-value">${companyName}</div>
    <div class="info-label">Founder Name:</div><div class="info-value">${founderName}</div>
    <div class="info-label">Email:</div><div class="info-value">${founderEmail}</div>
    <div class="info-label">Mobile:</div><div class="info-value">${founderMobile}</div>
    <div class="info-label">City:</div><div class="info-value">${city}</div>
    <div class="info-label">Sector:</div><div class="info-value">${sector}</div>
    <div class="info-label">Domain:</div><div class="info-value">${domain}</div>
    <div class="info-label">Stage:</div><div class="info-value">${startup.stage || 'N/A'}</div>
    <div class="info-label">Status:</div><div class="info-value">${startup.status || 'N/A'}</div>
    <div class="info-label">Team Size:</div><div class="info-value">${teamSize}</div>
  </div>

  ${problemText || solutionText ? `
  <h2>PROBLEM & SOLUTION</h2>
  ${problemText ? `<h3>Problem</h3><p>${problemText}</p>` : ''}
  ${solutionText ? `<h3>Solution</h3><p>${solutionText}</p>` : ''}
  ` : ''}

  ${startup.achievements && startup.achievements.length > 0 ? `
  <h2>ACHIEVEMENTS (${startup.achievements.length})</h2>
  ${startup.achievements.map((ach, idx) => `
    <div class="achievement">
      <h3>${idx + 1}. ${ach.title}</h3>
      <p>${ach.description || ''}</p>
      <p><strong>Date:</strong> ${formatDate(ach.date)} ${ach.type ? `| <strong>Type:</strong> ${ach.type}` : ''}</p>
    </div>
  `).join('')}
  ` : ''}

  ${startup.revenueHistory && startup.revenueHistory.length > 0 ? `
  <h2>REVENUE HISTORY</h2>
  <p><strong>Total Revenue: ₹${totalRevenue.toLocaleString()}</strong></p>
  <table>
    <tr><th>Date</th><th>Source</th><th>Amount</th><th>Description</th></tr>
    ${startup.revenueHistory.map(r => `
      <tr>
        <td>${formatDate(r.date)}</td>
        <td>${r.source || ''}</td>
        <td>₹${(r.amount || 0).toLocaleString()}</td>
        <td>${r.description || ''}</td>
      </tr>
    `).join('')}
  </table>
  ` : ''}

  ${startup.progressTracking ? `
  <h2>PROGRESS TRACKING</h2>
  <table>
    ${startup.progressTracking.proofOfConcept ? `<tr><td><strong>Proof of Concept</strong></td><td>${startup.progressTracking.proofOfConcept}</td></tr>` : ''}
    ${startup.progressTracking.prototypeDevelopment ? `<tr><td><strong>Prototype Development</strong></td><td>${startup.progressTracking.prototypeDevelopment}</td></tr>` : ''}
    ${startup.progressTracking.productDevelopment ? `<tr><td><strong>Product Development</strong></td><td>${startup.progressTracking.productDevelopment}</td></tr>` : ''}
    ${startup.progressTracking.fieldTrials ? `<tr><td><strong>Field Trials</strong></td><td>${startup.progressTracking.fieldTrials}</td></tr>` : ''}
    ${startup.progressTracking.marketLaunch ? `<tr><td><strong>Market Launch</strong></td><td>${startup.progressTracking.marketLaunch}</td></tr>` : ''}
    ${startup.progressTracking.numberOfEmployees ? `<tr><td><strong>Employees</strong></td><td>${startup.progressTracking.numberOfEmployees}</td></tr>` : ''}
    ${startup.progressTracking.ipRegistrations ? `<tr><td><strong>IP Registrations</strong></td><td>${startup.progressTracking.ipRegistrations}</td></tr>` : ''}
    ${startup.progressTracking.gemPortalProducts ? `<tr><td><strong>GEM Portal Products</strong></td><td>${startup.progressTracking.gemPortalProducts}</td></tr>` : ''}
    ${startup.progressTracking.loans ? `<tr><td><strong>Loans</strong></td><td>₹${Number(startup.progressTracking.loans).toLocaleString()}</td></tr>` : ''}
    ${startup.progressTracking.angelFunding ? `<tr><td><strong>Angel Funding</strong></td><td>₹${Number(startup.progressTracking.angelFunding).toLocaleString()}</td></tr>` : ''}
    ${startup.progressTracking.vcFunding ? `<tr><td><strong>VC Funding</strong></td><td>₹${Number(startup.progressTracking.vcFunding).toLocaleString()}</td></tr>` : ''}
  </table>
  ` : ''}

  ${smcSchedules.length > 0 || oneOnOneSchedules.length > 0 ? `
  <h2>MEETINGS & SESSIONS</h2>
  ${smcSchedules.length > 0 ? `
    <h3>SMC Meetings (${smcSchedules.length})</h3>
    ${smcSchedules.map((meeting, idx) => `
      <div class="meeting">
        <strong>${idx + 1}. ${formatDate(meeting.date)} - ${meeting.timeSlot || 'N/A'}</strong>
        ${meeting.completionData?.panelistName ? `<p><strong>Panelist:</strong> ${meeting.completionData.panelistName}</p>` : ''}
        ${meeting.completionData?.feedback ? `<p><strong>Feedback:</strong> ${meeting.completionData.feedback}</p>` : ''}
      </div>
    `).join('')}
  ` : ''}
  ${oneOnOneSchedules.length > 0 ? `
    <h3>One-on-One Sessions (${oneOnOneSchedules.length})</h3>
    ${oneOnOneSchedules.map((session, idx) => `
      <div class="meeting">
        <strong>${idx + 1}. ${formatDate(session.date)} - ${session.time || 'N/A'}</strong>
        ${session.completionData?.mentorName ? `<p><strong>Mentor:</strong> ${session.completionData.mentorName}</p>` : ''}
        ${session.completionData?.feedback ? `<p><strong>Feedback:</strong> ${session.completionData.feedback}</p>` : ''}
      </div>
    `).join('')}
  ` : ''}
  ` : ''}

  <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280;">
    <p>Report generated by MAGIC Incubation Management System</p>
    <p>${formatDate(new Date())}</p>
  </div>
</body>
</html>
  `;

  // Create blob and download
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MAGIC-${companyName.replace(/\s+/g, '-')}-Comprehensive-Report-${new Date().toISOString().split('T')[0]}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};
