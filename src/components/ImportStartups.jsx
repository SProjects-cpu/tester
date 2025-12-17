import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { generateId } from '../utils/storage';

export default function ImportStartups({ onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState([]);

  // Define required fields mapping - Based on startup_form_data.xlsx
  const fieldMapping = {
    // Startup Information
    'Magic Code': 'magicCode',
    'Name of Company': 'companyName',
    'City': 'city',
    'Sector': 'sector',
    'Domain': 'domain',
    'Is Startup Registered?': 'isRegistered',
    'Team Size': 'teamSize',
    'Stage of Startup Idea': 'stageOfIdea',
    'Problem': 'problemSolving',
    'Solution': 'solution',
    'Patent': 'hasPatent',
    'Referred From (S1)': 'referredFrom',
    'Website': 'website',
    'Pitch Deck': 'pitchDeck',
    'Target Customer': 'targetCustomer',
    'Paying Customers': 'hasPayingCustomers',
    'Social Media Platform': 'socialMediaPlatform',
    
    // Founder Information
    'Founder Name': 'founderName',
    'Age': 'founderAge',
    'Gender': 'founderGender',
    'Email': 'founderEmail',
    'Mobile Number': 'founderMobile',
    'Education': 'education',
    'College/Institution': 'college',
    'Address': 'address',
    
    // Registration Info
    'Registration Date': 'registrationDate',
    'Registered At': 'registeredAt',
    'Referred From (S3)': 'registrationReferredFrom',
    'Follow-up Remark': 'followUpRemark',
    
    // Status and Stage fields for arrangement
    'Status': 'status',
    'Stage': 'stage'
  };

  const requiredFields = [
    'Name of Company',
    'City',
    'Sector',
    'Domain',
    'Is Startup Registered?',
    'Team Size',
    'Stage of Startup Idea',
    'Problem',
    'Solution',
    'Patent',
    'Founder Name',
    'Age',
    'Gender',
    'Email',
    'Mobile Number',
    'Registration Date'
  ];

  // Generate template Excel file
  const downloadTemplate = () => {
    const headers = Object.keys(fieldMapping);
    
    // Create sample data row with instructions - Based on startup_form_data.xlsx format
    const sampleRow = {
      'Magic Code': 'AUTO',
      'Name of Company': 'Example Tech Solutions',
      'City': 'Mumbai',
      'Sector': 'Agritech Innovation',
      'Domain': 'AI & IoT',
      'Is Startup Registered?': 'Yes',
      'Team Size': '5',
      'Stage of Startup Idea': 'MVP',
      'Problem': 'Farmers lack real-time crop monitoring',
      'Solution': 'IoT-based smart farming platform',
      'Patent': 'No',
      'Referred From (S1)': 'LinkedIn',
      'Website': 'https://example.com',
      'Pitch Deck': 'File.pdf',
      'Target Customer': 'Small to medium farmers',
      'Paying Customers': 'Yes',
      'Social Media Platform': 'LinkedIn',
      'Founder Name': 'John Doe',
      'Age': '28',
      'Gender': 'Male',
      'Email': 'john@example.com',
      'Mobile Number': '+91 9876543210',
      'Education': 'B.Tech',
      'College/Institution': 'IIT Mumbai',
      'Address': '123 Main Street, Mumbai, Maharashtra',
      'Registration Date': '12/11/2024',
      'Registered At': 'MAGIC Incubator',
      'Referred From (S3)': 'University Event',
      'Follow-up Remark': 'Promising startup with strong team',
      'Status': 'Active',
      'Stage': 'S0'
    };

    // Create legend/instructions sheet
    const legendData = [
      { Field: 'REQUIRED FIELDS', Description: 'These fields MUST be filled', Example: '' },
      { Field: 'Name of Company', Description: 'Full legal or trading name', Example: 'Example Tech Solutions' },
      { Field: 'City', Description: 'City where startup is based', Example: 'Mumbai' },
      { Field: 'Sector', Description: 'Choose from: Agritech Innovation, Smart Industry City Services, Green Mobility, Defense Sector, Healthcare/Medicare, Fintech, E-commerce, Healthcare, Other', Example: 'Agritech Innovation' },
      { Field: 'Domain', Description: 'Technology domain', Example: 'AI, IoT, Robotics, SaaS, etc.' },
      { Field: 'Is Startup Registered?', Description: 'Yes or No', Example: 'Yes' },
      { Field: 'Team Size', Description: 'Number of team members', Example: '5' },
      { Field: 'Stage of Startup Idea', Description: 'Current stage', Example: 'Ideation, MVP, Growth' },
      { Field: 'Problem', Description: 'What problem are you solving?', Example: 'Farmers lack real-time monitoring' },
      { Field: 'Solution', Description: 'Your solution description', Example: 'IoT-based platform' },
      { Field: 'Patent', Description: 'Yes or No', Example: 'No' },
      { Field: 'Founder Name', Description: 'Full name of founder', Example: 'John Doe' },
      { Field: 'Age', Description: 'Age in years', Example: '28' },
      { Field: 'Gender', Description: 'Male, Female, Other, Prefer not to say', Example: 'Male' },
      { Field: 'Email', Description: 'Valid email address', Example: 'john@example.com' },
      { Field: 'Mobile Number', Description: 'Contact number with country code', Example: '+91 9876543210' },
      { Field: 'Registration Date', Description: 'Date of registration (DD/MM/YYYY or MM/DD/YYYY)', Example: '12/11/2024' },
      { Field: '', Description: '', Example: '' },
      { Field: 'OPTIONAL FIELDS', Description: 'These fields are optional', Example: '' },
      { Field: 'Magic Code', Description: 'Leave as AUTO for auto-generation or provide number', Example: 'AUTO or 1' },
      { Field: 'Referred From (S1)', Description: 'Source of referral for Stage 1', Example: 'LinkedIn, Friend, etc.' },
      { Field: 'Website', Description: 'Company website URL', Example: 'https://example.com' },
      { Field: 'Pitch Deck', Description: 'Pitch deck file name or path', Example: 'File.pdf' },
      { Field: 'Target Customer', Description: 'Target audience', Example: 'Small farmers, General public' },
      { Field: 'Paying Customers', Description: 'Yes or No', Example: 'Yes' },
      { Field: 'Social Media Platform', Description: 'Facebook, Instagram, Twitter, LinkedIn, YouTube, TikTok, Other', Example: 'LinkedIn' },
      { Field: 'Education', Description: 'Founder education', Example: 'B.Tech, MBA, B.Sc' },
      { Field: 'College/Institution', Description: 'Institution name', Example: 'IIT Mumbai' },
      { Field: 'Address', Description: 'Full address', Example: '123 Main Street, Mumbai' },
      { Field: 'Registered At', Description: 'Where startup registered', Example: 'MAGIC Incubator, Event ABC' },
      { Field: 'Referred From (S3)', Description: 'Registration source for Stage 3', Example: 'University Event, None' },
      { Field: 'Follow-up Remark', Description: 'Additional notes', Example: 'Promising startup, Follow-up pending' },
      { Field: 'Status', Description: 'Active, Onboarded, Graduated, Rejected, or Inactive (default: Active)', Example: 'Active' },
      { Field: 'Stage', Description: 'S0, S1, S2, S3, or One-on-One (default: S0)', Example: 'S0' }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add data sheet
    const ws = XLSX.utils.json_to_sheet([sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Startup Data');
    
    // Add legend sheet
    const legendWs = XLSX.utils.json_to_sheet(legendData);
    XLSX.utils.book_append_sheet(wb, legendWs, 'Instructions & Legend');
    
    // Download file
    XLSX.writeFile(wb, 'MAGIC_Startup_Import_Template.xlsx');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        alert('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file');
        return;
      }
      setFile(selectedFile);
      setResults(null);
      setErrors([]);
    }
  };

  const validateRow = (row, rowIndex) => {
    const rowErrors = [];
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = row[field];
      if (!value || String(value).trim() === '') {
        rowErrors.push(`Row ${rowIndex + 2}: Missing required field "${field}"`);
      }
    });

    // Validate email format
    if (row['Email']) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row['Email'])) {
        rowErrors.push(`Row ${rowIndex + 2}: Invalid email format`);
      }
    }

    // Validate age
    if (row['Age']) {
      const age = parseInt(row['Age']);
      if (isNaN(age) || age < 18 || age > 100) {
        rowErrors.push(`Row ${rowIndex + 2}: Age must be between 18 and 100`);
      }
    }

    // Validate team size
    if (row['Team Size']) {
      const teamSize = parseInt(row['Team Size']);
      if (isNaN(teamSize) || teamSize < 1) {
        rowErrors.push(`Row ${rowIndex + 2}: Team size must be at least 1`);
      }
    }

    return rowErrors;
  };

  const parseFile = async () => {
    if (!file) return;

    setImporting(true);
    setErrors([]);
    setResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setErrors(['The file is empty or has no valid data']);
        setImporting(false);
        return;
      }

      const allErrors = [];
      const validStartups = [];
      const existingStartups = JSON.parse(localStorage.getItem('startups') || '[]');
      let magicCodeCounter = existingStartups.length + 1;

      jsonData.forEach((row, index) => {
        // Validate row
        const rowErrors = validateRow(row, index);
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
          return;
        }

        // Map fields
        const startup = {};
        Object.keys(fieldMapping).forEach(excelField => {
          const dbField = fieldMapping[excelField];
          let value = row[excelField];
          
          // Handle magic code
          if (dbField === 'magicCode') {
            if (!value || value === 'AUTO') {
              value = String(magicCodeCounter++);
            }
          }
          
          // Convert to appropriate types
          if (['teamSize', 'founderAge'].includes(dbField) && value) {
            value = parseInt(value);
          }
          
          // Handle date format conversion (DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD)
          if (dbField === 'registrationDate' && value) {
            try {
              // Try to parse the date
              const dateStr = String(value);
              let parsedDate;
              
              // Check if it's already in YYYY-MM-DD format
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                parsedDate = dateStr;
              } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                // Handle DD/MM/YYYY or MM/DD/YYYY format
                const parts = dateStr.split('/');
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                parsedDate = `${year}-${month}-${day}`;
              } else {
                // Try to parse as Excel date number
                const excelDate = parseFloat(value);
                if (!isNaN(excelDate)) {
                  const date = new Date((excelDate - 25569) * 86400 * 1000);
                  parsedDate = date.toISOString().split('T')[0];
                }
              }
              
              if (parsedDate) {
                value = parsedDate;
              }
            } catch (e) {
              // Keep original value if parsing fails
            }
          }
          
          // Map Yes/No to proper format
          if (dbField === 'isRegistered' && value) {
            value = String(value).toLowerCase() === 'yes' ? 'Yes' : 'No';
          }
          if (dbField === 'hasPatent' && value) {
            value = String(value).toLowerCase() === 'yes' ? 'Yes' : 'No';
          }
          if (dbField === 'hasPayingCustomers' && value) {
            value = String(value).toLowerCase() === 'yes' ? 'Yes' : 'No';
          }
          
          startup[dbField] = value || '';
        });

        // Add system fields
        startup.id = generateId();
        
        // Handle status from Excel - map to valid values
        let importedStatus = row['Status'] ? String(row['Status']).trim() : 'Active';
        const validStatuses = ['Active', 'Onboarded', 'Graduated', 'Rejected', 'Inactive'];
        
        // Check if imported status is valid, otherwise default to Active
        if (!validStatuses.includes(importedStatus)) {
          importedStatus = 'Active';
        }
        
        startup.status = importedStatus;
        
        // Set stage based on status
        // If status is Onboarded, Graduated, or Rejected, keep stage as is or set to S0
        // Otherwise, default to S0 for Active/Inactive
        if (importedStatus === 'Onboarded' || importedStatus === 'Graduated' || importedStatus === 'Rejected') {
          startup.stage = row['Stage'] || 'S0'; // Allow stage from Excel if provided
        } else {
          startup.stage = 'S0'; // Default stage for Active/Inactive startups
        }
        
        startup.pitchHistory = [];
        startup.oneOnOneHistory = [];
        startup.createdAt = new Date().toISOString();

        validStartups.push(startup);
      });

      if (allErrors.length > 0) {
        setErrors(allErrors);
      }

      if (validStartups.length > 0) {
        setResults({
          total: jsonData.length,
          successful: validStartups.length,
          failed: jsonData.length - validStartups.length,
          startups: validStartups
        });
      } else {
        setErrors(['No valid startups found in the file']);
      }
    } catch (error) {
      setErrors([`Error parsing file: ${error.message}`]);
    } finally {
      setImporting(false);
    }
  };

  const handleImport = () => {
    if (results && results.startups.length > 0) {
      onImport(results.startups);
      onClose();
    }
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
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl magic-text-gradient font-bold">Import Startups</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Upload Excel or CSV file to bulk import startups
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Download Template Buttons */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Need a template?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Download Excel template with all required headers, sample data, and instructions
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Generate New Template</span>
                  </button>
                  <a
                    href="/startup_form_data.xlsx"
                    download="MAGIC_Startup_Reference_Template.xlsx"
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Reference File</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Upload File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center space-x-3 w-full px-6 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 hover:border-magic-500 dark:hover:border-magic-500 cursor-pointer transition-all group"
              >
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-magic-500 transition-colors" />
                <div className="text-center">
                  <p className="text-gray-900 dark:text-white font-medium">
                    {file ? file.name : 'Click to upload Excel or CSV file'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Supports .xlsx, .xls, and .csv formats
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Parse Button */}
          {file && !results && (
            <button
              onClick={parseFile}
              disabled={importing}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 magic-gradient text-white rounded-xl shadow-magic hover:shadow-magic-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-5 h-5" />
              <span>{importing ? 'Processing...' : 'Process File'}</span>
            </button>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Validation Errors ({errors.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800 dark:text-red-200">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Processing Complete
                  </h3>
                  <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                    <p>• Total rows: {results.total}</p>
                    <p>• Successfully processed: {results.successful}</p>
                    {results.failed > 0 && <p>• Failed: {results.failed}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          {results && results.successful > 0 && (
            <button
              onClick={handleImport}
              className="px-6 py-3 magic-gradient text-white rounded-xl shadow-magic hover:shadow-magic-lg transition-all"
            >
              Import {results.successful} Startup{results.successful !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
