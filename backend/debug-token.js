import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== JWT Token Debugger ===\n');

// Check if JWT_SECRET is configured
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not configured in .env file!');
  process.exit(1);
}

console.log('✅ JWT_SECRET is configured');
console.log('JWT_SECRET:', process.env.JWT_SECRET.substring(0, 10) + '...');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE || '7d');

// Test token generation
const testUserId = 'test-user-123';
const testToken = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});

console.log('\n✅ Test token generated successfully');
console.log('Token:', testToken.substring(0, 50) + '...');

// Test token verification
try {
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('\n✅ Test token verified successfully');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('\n❌ Token verification failed:', error.message);
}

console.log('\n=== Instructions ===');
console.log('1. Make sure your backend server is running');
console.log('2. Check that JWT_SECRET in backend/.env matches the one used to generate tokens');
console.log('3. If you changed JWT_SECRET, all users need to login again');
console.log('4. Check browser console for the token being sent');
console.log('5. Try logging out and logging in again to get a fresh token');
