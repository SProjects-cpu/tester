import prisma from './utils/prisma.js';

async function testDatabase() {
  console.log('🧪 Testing PostgreSQL Connection...\n');

  try {
    // Test 1: Connection
    console.log('Test 1: Database Connection');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to PostgreSQL\n');

    // Test 2: Count startups
    console.log('Test 2: Count Startups');
    const startupCount = await prisma.startup.count();
    console.log(`✅ Found ${startupCount} startups\n`);

    // Test 3: List all startups
    console.log('Test 3: List All Startups');
    const startups = await prisma.startup.findMany({
      include: {
        achievements: true,
        progressHistory: true
      }
    });
    
    if (startups.length > 0) {
      console.log('✅ Startups in database:');
      startups.forEach(s => {
        console.log(`   - ${s.name} (${s.sector}) - Stage: ${s.stage}`);
        console.log(`     Achievements: ${s.achievements.length}`);
        console.log(`     Progress Records: ${s.progressHistory.length}`);
      });
    } else {
      console.log('⚠️  No startups found. Run "npm run prisma:seed" to add sample data.');
    }
    console.log('');

    // Test 4: Count users
    console.log('Test 4: Count Users');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users\n`);

    // Test 5: List users
    console.log('Test 5: List Users');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true
      }
    });
    
    if (users.length > 0) {
      console.log('✅ Users in database:');
      users.forEach(u => {
        console.log(`   - ${u.name} (${u.email}) - Role: ${u.role}`);
      });
    } else {
      console.log('⚠️  No users found. Run "npm run prisma:seed" to add admin user.');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Database Summary:`);
    console.log(`   - Startups: ${startupCount}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Total Achievements: ${startups.reduce((sum, s) => sum + s.achievements.length, 0)}`);
    console.log(`   - Total Progress Records: ${startups.reduce((sum, s) => sum + s.progressHistory.length, 0)}`);
    console.log('');
    console.log('✅ PostgreSQL is ready to use!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run "npm run prisma:studio" to view your database');
    console.log('2. Run "npm start" to start the backend server');
    console.log('3. See SWITCH_TO_POSTGRESQL.md for integration guide');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify DATABASE_URL in .env file');
    console.error('3. Run "npx prisma migrate dev" to create tables');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
