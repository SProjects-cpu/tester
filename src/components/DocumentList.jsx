import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, FileText, Image, Table, File, Loader2, AlertCircle, FolderOpen, Plus } from 'lucide-react';
import { documentApi } from '../utils/api';

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

// Get icon for file type
const getFileIcon = (fileType) => {
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
  return iconMap[fileType?.toLowerCase()] || File;
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Required documents for verification reference
const REQUIRED_DOCUMENTS = [
  'Aadhaar',
  'PAN',
  'DPIIT Certificate',
  'CIN',
  'Electricity Bill',
  'Bank Passbook'
];

export default function DocumentList({ startupId, isGuest = false, allowUpload = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (startupId) {
      loadDocuments();
    } else {
      setLoading(false);
      setError('');
      setDocuments([]);
    }
  }, [startupId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await documentApi.getByStartupId(startupId);
      // Ensure we always have an array
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading documents:', err);
      // Show more specific error message
      if (err.message?.includes('Unauthorized')) {
        setError('Please login to view documents');
      } else {
        setError('Failed to load documents');
      }
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file.name)) {
      alert(`File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert('File size exceeds maximum limit of 10MB');
      return;
    }

    try {
      setUploading(true);
      const newDoc = await documentApi.upload(file, startupId);
      setDocuments([newDoc, ...documents]);
      alert('✅ Document uploaded successfully!');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('❌ Failed to upload document: ' + err.message);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (doc) => {
    try {
      setDownloadingId(doc.id);
      const { url, filename } = await documentApi.getDownloadUrl(doc.id);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || doc.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc) => {
    try {
      setDeletingId(doc.id);
      await documentApi.delete(doc.id);
      setDocuments(documents.filter(d => d.id !== doc.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Don't render anything for guests
  if (isGuest) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 py-4">
        <AlertCircle className="w-5 h-5" />
        <span className="font-medium">{error}</span>
        <button 
          onClick={loadDocuments}
          className="ml-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Required Documents Reference - Text Only */}
      {allowUpload && !isGuest && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-700">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 text-sm">
            Required Documents for Verification:
          </h4>
          <ul className="grid grid-cols-2 gap-1 text-sm text-amber-800 dark:text-amber-300">
            {REQUIRED_DOCUMENTS.map((doc, index) => (
              <li key={index} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Button - only show if allowUpload is true */}
      {allowUpload && !isGuest && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
            className="hidden"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Add Document</span>
              </>
            )}
          </motion.button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <FolderOpen className="w-12 h-12 mx-auto text-gray-500 dark:text-gray-400 mb-2" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">No documents uploaded</p>
          {allowUpload && !isGuest && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Click "Add Document" to upload files
            </p>
          )}
        </div>
      ) : (
        documents.map((doc) => {
          const FileIcon = getFileIcon(doc.fileType);
          const isDownloading = downloadingId === doc.id;
          const isDeleting = deletingId === doc.id;

          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                  <FileIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={doc.filename}>
                    {doc.filename}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Download"
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </motion.button>

                {/* Only show delete button when allowUpload is true (not for Quit startups) */}
                {allowUpload && (
                  confirmDelete === doc.id ? (
                    <div className="flex items-center space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(doc)}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setConfirmDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
