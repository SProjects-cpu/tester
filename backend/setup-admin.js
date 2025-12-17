import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { usersDB } from './utils/db.js';

dotenv.config();

const setupAdmin = async () => {
  try {
    console.log('🔧 Setting up admin user...');

    // Check if admin already exists
    const existingAdmin = usersDB.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('   Username:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('magic2024', 10);
    
    const admin = usersDB.create({
      username: 'admin',
      password: adminPassword,
      email: 'admin@magic.com',
      role: 'admin',
      isActive: true,
      lastLogin: null
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: magic2024');
    console.log('   Email: admin@magic.com');
    console.log('   Role: admin');
    console.log('');
    console.log('🎉 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    process.exit(1);
  }
};

setupAdmin();
