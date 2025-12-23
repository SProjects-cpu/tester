import { useState, useCallback } from 'react';
import { startupApi } from '../utils/api';
import { exportStartupsComprehensive, generateExportFileName } from '../utils/exportUtils';

/**
 * useStartupActions - Custom hook for common startup operations
 * Centralizes export, delete, and status change logic with authentication
 * 
 * @param {Object} options
 * @param {Function} options.onSuccess - Callback on successful operation
 * @param {Function} options.onError - Callback on error
 * @param {Function} options.setAdminAuthModal - Function to show admin auth modal
 * @returns {Object} Action handlers and state
 */
export default function useStartupActions({ onSuccess, onError, setAdminAuthModal }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle export with authentication
   */
  const handleExport = useCallback((format, data, fileName, dateRange = {}) => {
    setAdminAuthModal?.({
      isOpen: true,
      title: 'Export Startups',
      message: 'Please authenticate to export startup data. This ensures data security and tracks export activities.',
      actionType: 'info',
      onConfirm: () => {
        try {
          const exportFileName = generateExportFileName(fileName, dateRange.fromDate, dateRange.toDate);
          exportStartupsComprehensive(data, format, exportFileName.replace('MAGIC-', ''));
          alert(`${data.length} record(s) exported as ${format.toUpperCase()}!`);
          onSuccess?.('export');
        } catch (err) {
          setError(err.message);
          onError?.(err);
          alert('Export failed: ' + err.message);
        }
      }
    });
  }, [setAdminAuthModal, onSuccess, onError]);

  /**
   * Handle delete with confirmation
   */
  const handleDelete = useCallback((startup, onDeleteSuccess) => {
    setAdminAuthModal?.({
      isOpen: true,
      title: 'Delete Startup',
      message: `You are about to permanently delete "${startup?.companyName}". This action cannot be undone. Please authenticate to proceed.`,
      actionType: 'danger',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setError(null);
          await startupApi.delete(startup.id);
          onDeleteSuccess?.(startup.id);
          onSuccess?.('delete', startup);
          alert('✅ Startup deleted successfully!');
        } catch (err) {
          setError(err.message);
          onError?.(err);
          alert('❌ Failed to delete startup: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [setAdminAuthModal, onSuccess, onError]);

  /**
   * Handle status change with validation
   */
  const handleStatusChange = useCallback(async (startup, newStatus, additionalData = {}) => {
    const statusMessages = {
      'Onboarded': `onboard "${startup.companyName}"`,
      'Graduated': `graduate "${startup.companyName}"`,
      'Rejected': `reject "${startup.companyName}"`,
      'Inactive': `mark "${startup.companyName}" as inactive`
    };

    setAdminAuthModal?.({
      isOpen: true,
      title: `${newStatus} Startup`,
      message: `You are about to ${statusMessages[newStatus] || `change status of "${startup.companyName}" to ${newStatus}`}. Please authenticate to proceed.`,
      actionType: newStatus === 'Rejected' ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const updateData = {
            stage: newStatus,
            status: newStatus,
            ...additionalData
          };

          // Add date fields based on status
          if (newStatus === 'Graduated' && !additionalData.graduatedDate) {
            updateData.graduatedDate = new Date().toISOString();
          }
          if (newStatus === 'Onboarded' && !additionalData.onboardedDate) {
            updateData.onboardedDate = new Date().toISOString();
          }
          if (newStatus === 'Rejected' && !additionalData.rejectedDate) {
            updateData.rejectedDate = new Date().toISOString();
            updateData.rejectedFromStage = startup.stage;
          }

          const result = await startupApi.update(startup.id, updateData);
          onSuccess?.('statusChange', result);
          alert(`✅ ${startup.companyName} has been ${newStatus.toLowerCase()}!`);
          return result;
        } catch (err) {
          setError(err.message);
          onError?.(err);
          alert(`❌ Failed to ${newStatus.toLowerCase()} startup: ` + err.message);
          throw err;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [setAdminAuthModal, onSuccess, onError]);

  /**
   * Handle graduation specifically
   */
  const handleGraduate = useCallback((startup, onGraduateSuccess) => {
    setAdminAuthModal?.({
      isOpen: true,
      title: 'Graduate Startup',
      message: `You are about to graduate "${startup.companyName}". This will lock the startup and mark it as completed. This action cannot be easily undone. Please authenticate to proceed.`,
      actionType: 'info',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const result = await startupApi.update(startup.id, { 
            stage: 'Graduated',
            status: 'Graduated', 
            graduatedDate: new Date().toISOString() 
          });
          
          onGraduateSuccess?.(result);
          onSuccess?.('graduate', result);
          alert(`✅ ${startup.companyName} has been graduated!`);
          return result;
        } catch (err) {
          setError(err.message);
          onError?.(err);
          alert('❌ Failed to graduate startup: ' + err.message);
          throw err;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [setAdminAuthModal, onSuccess, onError]);

  /**
   * Handle update with authentication
   */
  const handleUpdate = useCallback((startup, onUpdateSuccess) => {
    setAdminAuthModal?.({
      isOpen: true,
      title: 'Edit Startup',
      message: `You are about to edit "${startup.companyName}". Please authenticate to save changes.`,
      actionType: 'warning',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          setError(null);
          const result = await startupApi.update(startup.id, startup);
          onUpdateSuccess?.(result);
          onSuccess?.('update', result);
          alert('✅ Startup updated successfully!');
          return result;
        } catch (err) {
          setError(err.message);
          onError?.(err);
          alert('❌ Failed to update startup: ' + err.message);
          throw err;
        } finally {
          setIsLoading(false);
        }
      }
    });
  }, [setAdminAuthModal, onSuccess, onError]);

  return {
    handleExport,
    handleDelete,
    handleStatusChange,
    handleGraduate,
    handleUpdate,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}
