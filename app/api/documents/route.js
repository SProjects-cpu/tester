import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Transform document for frontend
const transformDocument = (doc) => ({
  id: doc.id,
  startupId: doc.startupId,
  fileName: doc.fileName,
  fileType: doc.fileType,
  fileSize: doc.fileSize,
  fileUrl: doc.fileUrl,
  storagePath: doc.storagePath,
  uploadedAt: doc.uploadedAt ? doc.uploadedAt.toISOString() : null,
  createdAt: doc.createdAt ? doc.createdAt.toISOString() : null
});

// GET - List all documents or by startup
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startupId = searchParams.get('startupId');

    const where = startupId ? { startupId } : {};
    
    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: { startup: { select: { name: true } } }
    });

    return NextResponse.json(documents.map(doc => ({
      ...transformDocument(doc),
      startupName: doc.startup?.name
    })));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// POST - Upload new document
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role === 'guest') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const startupId = formData.get('startupId');

    if (!file || !startupId) {
      return NextResponse.json({ message: 'File and startupId are required' }, { status: 400 });
    }

    // Verify startup exists
    const startup = await prisma.startup.findUnique({ where: { id: startupId } });
    if (!startup) {
      return NextResponse.json({ message: 'Startup not found' }, { status: 404 });
    }

    // Get file details
    const fileName = file.name;
    const fileType = file.type || 'application/octet-stream';
    const fileSize = file.size;
    const fileBuffer = await file.arrayBuffer();
    
    // Create unique storage path
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${startupId}/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('startup-documents')
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ message: 'Failed to upload file', error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('startup-documents')
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        startupId,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        storagePath
      }
    });

    return NextResponse.json(transformDocument(document), { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
