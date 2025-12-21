import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, FileText, Image, Table, File, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import { documentApi } from '../utils/api';

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

export default function DocumentList({ startupId, isGuest = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (startupId) {
      loadDocuments();
    }
  }, [startupId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await documentApi.getByStartupId(startupId);
      setDocuments(data);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
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
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-500 py-4">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">No documents uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const FileIcon = getFileIcon(doc.fileType);
        const isDownloading = downloadingId === doc.id;
        const isDeleting = deletingId === doc.id;

        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                <FileIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.filename}>
                  {doc.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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

              {confirmDelete === doc.id ? (
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
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
