import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/achievements/:startupId
// @desc    Add achievement to startup
// @access  Private (Admin only)
router.post('/:startupId', [protect, adminOnly], async (req, res) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.startupId }
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    const achievement = await prisma.achievement.create({
      data: {
        startupId: req.params.startupId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'Achievement',
        date: req.body.date ? new Date(req.body.date) : new Date(),
        mediaUrl: req.body.mediaUrl,
        isGraduated: req.body.isGraduated || false
      }
    });
    
    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/achievements/:startupId/:achievementId
// @desc    Remove achievement from startup
// @access  Private (Admin only)
router.delete('/:startupId/:achievementId', [protect, adminOnly], async (req, res) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.startupId }
    });
    
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    await prisma.achievement.delete({
      where: { id: req.params.achievementId }
    });
    
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
