import express from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// @route   GET /api/guests
// @desc    Get all guest users
// @access  Private (Admin only)
router.get('/', [protect, adminOnly], async (req, res) => {
  try {
    const guests = await prisma.user.findMany({
      where: { role: 'guest' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/guests
// @desc    Create guest user
// @access  Private (Admin only)
router.post('/', [
  protect,
  adminOnly,
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const guest = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        password: hashedPassword,
        email,
        role: 'guest',
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(guest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/guests/:id
// @desc    Update guest user
// @access  Private (Admin only)
router.put('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const { username, email, isActive } = req.body;

    const guest = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!guest || guest.role !== 'guest') {
      return res.status(404).json({ message: 'Guest not found' });
    }

    const updates = {};
    if (username) updates.username = username.toLowerCase();
    if (email !== undefined) updates.email = email;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: updates,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/guests/:id
// @desc    Delete guest user
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const guest = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!guest || guest.role !== 'guest') {
      return res.status(404).json({ message: 'Guest not found' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
