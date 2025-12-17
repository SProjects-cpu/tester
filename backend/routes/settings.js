import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/settings
// @desc    Get all settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    
    // Convert to key-value object format
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/settings/:key
// @desc    Get setting by key
// @access  Private
router.get('/:key', protect, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key }
    });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update setting
// @access  Private (Admin only)
router.put('/:key', [protect, adminOnly], async (req, res) => {
  try {
    const { value, description } = req.body;

    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value, description },
      create: { key: req.params.key, value, description }
    });

    res.json({ key: setting.key, value: setting.value, description: setting.description });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
