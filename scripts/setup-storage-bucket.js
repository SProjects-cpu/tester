/**
 * Setup script for Supabase Storage bucket
 * 
 * This script creates the 'startup-documents' bucket in Supabase Storage.
 * 
 * IMPORTANT: You need to create the bucket manually in Supabase Dashboard:
 * 1. Go to https://supabase.com/dashboard/project/cvaaeqrbblwwmcchdadl/storage/buckets
 * 2. Click "New bucket"
 * 3. Name: startup-documents
 * 4. Public bucket: OFF (keep private for security)
 * 5. Click "Create bucket"
 * 
 * Then set up RLS policies:
 * 1. Go to Storage > Policies
 * 2. Add policy for INSERT: Allow authenticated users to upload
 * 3. Add policy for SELECT: Allow authenticated users to download
 * 4. Add policy for DELETE: Allow authenticated users to delete
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvaaeqrbblwwmcchdadl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.log('='.repeat(60));
  console.log('MANUAL SETUP REQUIRED');
  console.log('='.repeat(60));
  console.log('');
  console.log('Please create the storage bucket manually in Supabase Dashboard:');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/cvaaeqrbblwwmcchdadl/storage/buckets');
  console.log('2. Click "New bucket"');
  console.log('3. Bucket name: startup-documents');
  console.log('4. Public bucket: OFF (keep private)');
  console.log('5. Click "Create bucket"');
  console.log('');
  console.log('Then configure storage policies for authenticated access.');
  console.log('='.repeat(60));
  process.exit(0);
}

async function setupBucket() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('startup-documents', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ]
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "startup-documents" already exists');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Bucket "startup-documents" created successfully');
    }
  } catch (err) {
    console.error('❌ Error creating bucket:', err.message);
  }
}

setupBucket();
