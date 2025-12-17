import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/settings/:key - Get single setting
export const GET = requireAuth(async (request, { params }) => {
  try {
    const { key } = params;
    
    const setting = await prisma.settings.findUnique({
      where: { key }
    });

    if (!setting) {
      return NextResponse.json(
        { message: 'Setting not found' },
        { status: 404 }
      );
    }

    try {
      return NextResponse.json({ value: JSON.parse(setting.value) });
    } catch {
      return NextResponse.json({ value: setting.value });
    }
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/settings/:key - Update setting
export const PUT = requireAuth(async (request, { params }) => {
  try {
    const { key } = params;
    const body = await request.json();
    
    const value = typeof body.value === 'string' 
      ? body.value 
      : JSON.stringify(body.value);

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    try {
      return NextResponse.json({ value: JSON.parse(setting.value) });
    } catch {
      return NextResponse.json({ value: setting.value });
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
