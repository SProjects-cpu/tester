import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/one-on-one
// @desc    Get all one-on-one sessions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    
    const where = {};
    if (status) where.status = status;

    const sessions = await prisma.oneOnOneMeeting.findMany({
      where,
      include: {
        startup: true
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/one-on-one
// @desc    Create one-on-one session
// @access  Private (Admin only)
router.post('/', [protect, adminOnly], async (req, res) => {
  try {
    const startupId = req.body.startup || req.body.startupId;
    
    const session = await prisma.oneOnOneMeeting.create({
      data: {
        startupId,
        date: new Date(req.body.date),
        time: req.body.time,
        mentorName: req.body.mentorName || '',
        status: 'Scheduled',
        feedback: '',
        progress: ''
      },
      include: {
        startup: true
      }
    });

    // Update startup stage to One-on-One
    await prisma.startup.update({
      where: { id: startupId },
      data: { stage: 'One-on-One' }
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/one-on-one/:id/complete
// @desc    Mark session as completed
// @access  Private (Admin only)
router.put('/:id/complete', [protect, adminOnly], async (req, res) => {
  try {
    const { feedback, progress } = req.body;

    const session = await prisma.oneOnOneMeeting.findUnique({
      where: { id: req.params.id }
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Update session
    const updatedSession = await prisma.oneOnOneMeeting.update({
      where: { id: req.params.id },
      data: {
        status: 'Completed',
        feedback,
        progress,
        completedAt: new Date()
      },
      include: {
        startup: true
      }
    });

    res.json(updatedSession);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/one-on-one/:id
// @desc    Delete session
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    await prisma.oneOnOneMeeting.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
