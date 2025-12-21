import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Transform guest for frontend
const transformGuest = (guest) => ({
  id: guest.id,
  name: guest.name,
  email: guest.email,
  phone: guest.phone,
  organization: guest.organization,
  purpose: guest.purpose,
  isActive: guest.isActive,
  expiresAt: guest.expiresAt ? guest.expiresAt.toISOString().split('T')[0] : null,
  createdAt: guest.createdAt ? guest.createdAt.toISOString().split('T')[0] : null,
  updatedAt: guest.updatedAt
});

// GET - Get single guest
export async function GET(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const guest = await prisma.guest.findUnique({ where: { id } });

    if (!guest) {
      return NextResponse.json({ message: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json(transformGuest(guest));
  } catch (error) {
    console.error('Error fetching guest:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// PUT - Update guest
export async function PUT(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, email, password, phone, organization, purpose, isActive, expiresAt } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (phone !== undefined) updateData.phone = phone;
    if (organization !== undefined) updateData.organization = organization;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    
    // Only hash and update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(transformGuest(guest));
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// DELETE - Delete guest
export async function DELETE(request, { params }) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await prisma.guest.delete({ where: { id } });

    return NextResponse.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
