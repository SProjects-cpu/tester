import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in serverless (Vercel best practice)
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store in global to prevent connection explosion on Vercel
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle graceful shutdown (only in non-serverless)
if (process.env.VERCEL !== '1') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
