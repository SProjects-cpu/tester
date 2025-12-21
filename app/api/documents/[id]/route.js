import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get single document
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: { startup: { select: { name: true } } }
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: document.id,
      startupId: document.startupId,
      startupName: document.startup?.name,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      fileUrl: document.fileUrl,
      storagePath: document.storagePath,
      uploadedAt: document.uploadedAt?.toISOString(),
      createdAt: document.createdAt?.toISOString()
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// DELETE - Delete document
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role === 'guest') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Get document to find storage path
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('startup-documents')
      .remove([document.storagePath]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      // Continue to delete from database even if storage delete fails
    }

    // Delete from database
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
