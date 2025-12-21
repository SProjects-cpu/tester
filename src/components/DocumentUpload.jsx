import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Image, Table, File, AlertCircle } from 'lucide-react';

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  'pdf', 'pptx', 'ppt', 'doc', 'docx',
  'xls', 'xlsx', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'gif'
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Get file extension
const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Validate file type
const isValidFileType = (filename) => {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get icon for file type
const getFileIcon = (filename) => {
  const ext = getFileExtension(filename);
  const iconMap = {
    pdf: FileText,
    ppt: FileText,
    pptx: FileText,
    doc: FileText,
    docx: FileText,
    xls: Table,
    xlsx: Table,
    csv: Table,
    txt: FileText,
    jpg: Image,
    jpeg: Image,
    png: Image,
    gif: Image
  };
  return iconMap[ext] || File;
};

export default function DocumentUpload({ files, onChange, maxFiles = 5 }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (newFiles) => {
    setError('');
    const validFiles = [];
    
    for (const file of newFiles) {
      // Check if it's a folder (folders have no type and size is 0 or very small)
      if (file.type === '' && file.size === 0) {
        setError('Folders cannot be uploaded. Please select individual files.');
        continue;
      }

      // Check file type
      if (!isValidFileType(file.name)) {
        setError(`"${file.name}" is not a supported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 10MB size limit.`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.name === file.name && f.size === file.size);
      if (isDuplicate) {
        continue;
      }

      validFiles.push(file);
    }

    // Check max files limit
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. You can add ${maxFiles - files.length} more.`);
      const allowedCount = maxFiles - files.length;
      onChange([...files, ...validFiles.slice(0, allowedCount)]);
    } else {
      onChange([...files, ...validFiles]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
    setError('');
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
        Documents (optional)
      </label>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
          className="hidden"
        />
        
        <Upload className={`w-8 h-8 mx-auto mb-2 ${
          dragActive ? 'text-purple-500' : 'text-gray-400'
        }`} />
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-purple-600 dark:text-purple-400">Click to upload</span>
          {' '}or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          PDF, PPTX, DOC, XLS, CSV, TXT, JPG, PNG (max 10MB each)
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.name);
              return (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <FileIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Count */}
      {files.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {files.length} of {maxFiles} files selected
        </p>
      )}
    </div>
  );
}
