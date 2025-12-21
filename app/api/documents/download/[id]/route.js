import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import supabase from '@/lib/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Download a document (returns signed URL)
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized. Please login.' }, { status: 401 });
    }

    // Only admins can download documents (not guests)
    if (user.role === 'guest') {
      return NextResponse.json({ message: 'Access denied. Admin only.' }, { status: 403 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Document ID is required' }, { status: 400 });
    }

    // Find document in database
    const document = await prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    // Generate signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('startup-documents')
      .createSignedUrl(document.storagePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Error generating signed URL:', signedUrlError);
      return NextResponse.json(
        { message: 'Failed to generate download URL', error: signedUrlError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      filename: document.filename,
      fileType: document.fileType,
      fileSize: document.fileSize
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
