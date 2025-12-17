import bcrypt from 'bcryptjs';
import { usersDB } from './utils/db.js';

const resetAdminPassword = async () => {
  try {
    console.log('🔧 Resetting admin password...');

    // Find admin user
    const admin = usersDB.findOne({ username: 'admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('Run: node setup-admin.js to create admin user');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Username:', admin.username);
    console.log('   Current Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('');

    // Set new credentials
    const newEmail = 'rutvik@gmail.com';
    const newPassword = 'rutvik';

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin user
    usersDB.update(admin.id, {
      email: newEmail,
      password: hashedPassword
    });

    console.log('✅ Admin credentials updated successfully!');
    console.log('');
    console.log('📝 New Credentials:');
    console.log('   Username: admin');
    console.log('   Password: rutvik');
    console.log('   Email: rutvik@gmail.com');
    console.log('');
    console.log('🎉 You can now login with these credentials!');
    console.log('   Login at: http://localhost:5173');
    console.log('');

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  }
};

resetAdminPassword();
