import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('magic2024', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@magic.com' },
    update: {},
    create: {
      email: 'admin@magic.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample startup
  const startup = await prisma.startup.create({
    data: {
      name: 'TechVenture Solutions',
      founder: 'John Doe',
      email: 'john@techventure.com',
      phone: '+91-9876543210',
      sector: 'Technology',
      stage: 'Onboarded',
      description: 'AI-powered business solutions',
      website: 'https://techventure.com',
      fundingReceived: 500000,
      employeeCount: 5,
      revenueGenerated: 100000,
    },
  });

  console.log('✅ Created sample startup:', startup.name);

  // Create sample achievement
  await prisma.achievement.create({
    data: {
      startupId: startup.id,
      title: 'Secured Seed Funding',
      description: 'Raised $500K in seed funding',
      type: 'funding',
      date: new Date(),
    },
  });

  console.log('✅ Created sample achievement');

  // Create sample progress history
  await prisma.progressHistory.create({
    data: {
      startupId: startup.id,
      metric: 'revenue',
      value: 100000,
      date: new Date(),
      notes: 'First quarter revenue',
    },
  });

  console.log('✅ Created sample progress history');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
