import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Use memory storage for Supabase (files stored in memory before upload)
const storage = multer.memoryStorage();

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Allowed: JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX'));
  }
});

/**
 * Upload file to Supabase Storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Folder name in bucket (default: 'documents')
 * @returns {Promise<String>} - Public URL of uploaded file
 */
export async function uploadToSupabase(file, folder = 'documents') {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${timestamp}-${randomString}${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('startup-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('startup-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Upload to Supabase failed:', error);
    throw error;
  }
}

/**
 * Delete file from Supabase Storage
 * @param {String} fileUrl - Public URL of the file
 * @returns {Promise<Boolean>} - Success status
 */
export async function deleteFromSupabase(fileUrl) {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split('/startup-documents/');
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }
    const filePath = urlParts[1];

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('startup-documents')
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete from Supabase failed:', error);
    throw error;
  }
}

/**
 * Get signed URL for private files (valid for 1 hour)
 * @param {String} filePath - Path to file in bucket
 * @returns {Promise<String>} - Signed URL
 */
export async function getSignedUrl(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from('startup-documents')
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL failed:', error);
    throw error;
  }
}

export default {
  upload,
  uploadToSupabase,
  deleteFromSupabase,
  getSignedUrl
};
