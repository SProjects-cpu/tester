import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Prevent multiple instances of Prisma Client in development and production
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Cache the client in development to prevent hot-reload issues
// In production, this ensures we reuse the same client instance
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} else {
  // Also cache in production to prevent connection exhaustion
  globalForPrisma.prisma = prisma;
}

export default prisma;
