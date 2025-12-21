/**
 * Document validation utilities for startup document uploads
 */

// Allowed file extensions (case-insensitive)
export const ALLOWED_EXTENSIONS = [
  'pdf', 'pptx', 'ppt', 'doc', 'docx',
  'xls', 'xlsx', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'gif'
];

// MIME type mapping for file type detection
export const MIME_TYPE_MAP = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif'
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Extract file extension from filename
 * @param {string} filename - The filename to extract extension from
 * @returns {string} - Lowercase file extension without dot
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if a file type is valid based on extension
 * @param {string} filename - The filename to validate
 * @returns {boolean} - True if file type is allowed
 */
export function isValidFileType(filename) {
  const extension = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Check if a MIME type is valid
 * @param {string} mimeType - The MIME type to validate
 * @returns {boolean} - True if MIME type is allowed
 */
export function isValidMimeType(mimeType) {
  return Object.keys(MIME_TYPE_MAP).includes(mimeType);
}

/**
 * Check if file size is within limits
 * @param {number} size - File size in bytes
 * @returns {boolean} - True if size is within limit
 */
export function isValidFileSize(size) {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Generate storage path for a document
 * @param {string} startupId - The startup ID
 * @param {string} originalFilename - The original filename
 * @returns {string} - Storage path in format: {startup_id}/{timestamp}_{filename}
 */
export function generateStoragePath(startupId, originalFilename) {
  if (!startupId || !originalFilename) {
    throw new Error('startupId and originalFilename are required');
  }
  
  const timestamp = Date.now();
  // Sanitize filename - remove special characters except dots and underscores
  const sanitizedFilename = originalFilename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
  
  return `${startupId}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Get file type icon name based on extension
 * @param {string} filename - The filename
 * @returns {string} - Icon name for the file type
 */
export function getFileTypeIcon(filename) {
  const extension = getFileExtension(filename);
  
  const iconMap = {
    pdf: 'FileText',
    ppt: 'Presentation',
    pptx: 'Presentation',
    doc: 'FileText',
    docx: 'FileText',
    xls: 'Table',
    xlsx: 'Table',
    csv: 'Table',
    txt: 'FileText',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image'
  };
  
  return iconMap[extension] || 'File';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate a file for upload
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }} - Validation result
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (!isValidFileType(file.name)) {
    return { 
      valid: false, 
      error: `File type not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}` 
    };
  }
  
  if (!isValidFileSize(file.size)) {
    return { 
      valid: false, 
      error: `File size exceeds maximum limit of ${formatFileSize(MAX_FILE_SIZE)}` 
    };
  }
  
  return { valid: true };
}
