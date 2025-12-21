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

// GET - List all guests
export async function GET(request) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const guests = await prisma.guest.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(guests.map(transformGuest));
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}

// POST - Create new guest
export async function POST(request) {
  try {
    const user = getAuthUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, phone, organization, purpose, expiresAt } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if guest already exists
    const existingGuest = await prisma.guest.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingGuest) {
      return NextResponse.json({ message: 'Guest with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const guest = await prisma.guest.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        organization,
        purpose,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      }
    });

    return NextResponse.json(transformGuest(guest), { status: 201 });
  } catch (error) {
    console.error('Error creating guest:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
