// Test pooler connection with correct password
process.env.DATABASE_URL = "postgresql://postgres:DUivLUKPXNMx2UOF@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
process.env.DIRECT_URL = "postgresql://postgres:DUivLUKPXNMx2UOF@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testDatabase() {
  try {
    console.log('Testing DIRECT database connection (without pgbouncer)...');
    console.log('Connection string:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
    
    // Test connection with timeout
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ Database connected successfully');
    
    // Check for users
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} user(s) in database`);
    
    if (users.length > 0) {
      console.log('Users:', users.map(u => ({ email: u.email, role: u.role, name: u.name })));
    } else {
      console.log('⚠️ No users found in database. Need to seed!');
    }
    
    // Check for startups
    const startups = await prisma.startup.count();
    console.log(`✅ Found ${startups} startup(s) in database`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    if (error.message.includes('timeout')) {
      console.error('\n💡 Possible issues:');
      console.error('   1. Database is paused in Supabase');
      console.error('   2. Wrong password or connection string');
      console.error('   3. Network/firewall blocking connection');
      console.error('   4. Database project deleted');
      console.error('\n🔧 Solution: Go to Supabase dashboard and check project status');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
