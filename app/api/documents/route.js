import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import supabase from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Allowed file extensions
const ALLOWED_EXTENSIONS = [
  'pdf', 'pptx', 'ppt', 'doc', 'docx',
  'xls', 'xlsx', 'csv', 'txt',
  'jpg', 'jpeg', 'png', 'gif'
];

// Max file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Get file extension from filename
function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Validate file type
function isValidFileType(filename) {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Generate storage path
function generateStoragePath(startupId, filename) {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${startupId}/${timestamp}_${sanitizedFilename}`;
}

// GET - Fetch documents for a startup
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get('startupId');

    if (!startupId) {
      return NextResponse.json({ message: 'startupId is required' }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: { startupId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Upload a new document
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (guests cannot upload)
    if (user.role === 'guest') {
      return NextResponse.json({ message: 'Guests cannot upload documents' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const startupId = formData.get('startupId');

    if (!file || !startupId) {
      return NextResponse.json(
        { message: 'File and startupId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { message: `File type not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    // Verify startup exists
    const startup = await prisma.startup.findUnique({
      where: { id: startupId }
    });

    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    // Generate storage path
    const storagePath = generateStoragePath(startupId, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('startup-documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { message: 'Failed to upload file to storage', error: uploadError.message },
        { status: 500 }
      );
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        startupId,
        filename: file.name,
        fileType: getFileExtension(file.name),
        fileSize: file.size,
        storagePath
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
