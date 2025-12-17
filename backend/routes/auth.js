import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { generateToken, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      expiresIn: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token (even if expired, we can still decode it)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Generate new token
    const newToken = generateToken(user.id);

    res.json({
      token: newToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      expiresIn: 30 * 24 * 60 * 60 * 1000
    });
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return res.status(401).json({ message: 'Token refresh failed' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password
// @access  Private
router.post('/change-password', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/verify-admin
// @desc    Verify admin credentials for sensitive operations
// @access  Private (Admin only)
router.post('/verify-admin', [
  protect,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        verified: false,
        message: 'Only administrators can perform this action' 
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user || user.role !== 'admin' || !user.isActive) {
      return res.status(401).json({ 
        verified: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        verified: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Log the verification attempt
    console.log(`Admin verification successful for ${email} at ${new Date().toISOString()}`);

    res.json({
      verified: true,
      message: 'Admin credentials verified successfully',
      admin: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ 
      verified: false,
      message: 'Server error during verification',
      error: error.message 
    });
  }
});

// @route   PUT /api/auth/update-admin-credentials
// @desc    Update admin email and/or password
// @access  Private (Admin only)
router.put('/update-admin-credentials', [
  protect,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newEmail').optional().isEmail().withMessage('Valid email is required'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword } = req.body;

    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can update credentials' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const updates = {};

    // Update email if provided
    if (newEmail && newEmail !== user.email) {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = newEmail.toLowerCase();
    }

    // Update password if provided
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates
    });

    res.json({ 
      message: 'Admin credentials updated successfully',
      updated: Object.keys(updates)
    });
  } catch (error) {
    console.error('Update admin credentials error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
