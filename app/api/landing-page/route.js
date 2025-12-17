import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Default landing page data
const defaultLandingData = {
  header: {
    title: "MAGIC",
    subtitle: "Startup Incubation & SME Accelerator",
    tagline: "Empowering Innovation, Accelerating Growth"
  },
  hero: {
    title: "Transform Your Startup Journey",
    description: "Join CMIA Marathwada's premier incubation program and accelerate your path to success",
    cta: "Get Started"
  },
  stats: {
    startups: 0,
    funding: 0,
    mentors: 0,
    success: 0
  },
  features: [
    {
      title: "Expert Mentorship",
      description: "Get guidance from industry leaders and successful entrepreneurs",
      icon: "users"
    },
    {
      title: "Funding Support",
      description: "Access to seed funding and investor networks",
      icon: "trending-up"
    },
    {
      title: "Infrastructure",
      description: "State-of-the-art facilities and resources",
      icon: "award"
    }
  ],
  news: [],
  contact: {
    email: "info@magic.com",
    phone: "+91-1234567890",
    address: "CMIA Marathwada, India"
  },
  footer: {
    title: "MAGIC",
    tagline: "Empowering Startups",
    copyright: "© 2024 CMIA Marathwada. All rights reserved."
  }
};

// GET /api/landing-page - Get landing page content
export async function GET(request) {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'landingPage' }
    });

    if (!setting) {
      return NextResponse.json(defaultLandingData);
    }

    try {
      const data = JSON.parse(setting.value);
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(defaultLandingData);
    }
  } catch (error) {
    console.error('Error fetching landing page:', error);
    return NextResponse.json(defaultLandingData);
  }
}

// PUT /api/landing-page - Update landing page content
export const PUT = requireAuth(async (request) => {
  try {
    const body = await request.json();
    
    const value = JSON.stringify(body);

    await prisma.settings.upsert({
      where: { key: 'landingPage' },
      update: { value },
      create: { key: 'landingPage', value }
    });

    return NextResponse.json({ message: 'Landing page updated successfully', data: body });
  } catch (error) {
    console.error('Error updating landing page:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
});
