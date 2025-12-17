// Set environment variables
process.env.DATABASE_URL = "postgresql://postgres:QlF9ggCSJWWlzKgc@db.sibzhdtagwhcjootfzek.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1";
process.env.DIRECT_URL = "postgresql://postgres:QlF9ggCSJWWlzKgc@db.sibzhdtagwhcjootfzek.supabase.co:5432/postgres";

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check for users
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} user(s) in database`);
    
    if (users.length > 0) {
      console.log('Users:', users.map(u => ({ email: u.email, role: u.role })));
    } else {
      console.log('⚠️ No users found in database. Need to seed!');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
