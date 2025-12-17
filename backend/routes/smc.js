import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/smc
// @desc    Get all SMC schedules
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { date, status } = req.query;
    
    const where = {};
    if (date) where.date = new Date(date);
    if (status) where.status = status;

    const schedules = await prisma.smcMeeting.findMany({
      where,
      include: {
        startup: true
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/smc
// @desc    Create SMC schedule
// @access  Private (Admin only)
router.post('/', [protect, adminOnly], async (req, res) => {
  try {
    const { startupId, date, timeSlot } = req.body;

    // Check if slot is already booked
    const existing = await prisma.smcMeeting.findFirst({
      where: {
        date: new Date(date),
        timeSlot,
        status: 'Scheduled'
      }
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Time slot already booked' });
    }

    const schedule = await prisma.smcMeeting.create({
      data: {
        startupId,
        date: new Date(date),
        timeSlot,
        status: 'Scheduled',
        panelistName: '',
        feedback: ''
      },
      include: {
        startup: true
      }
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/smc/:id/complete
// @desc    Mark SMC as completed
// @access  Private (Admin only)
router.put('/:id/complete', [protect, adminOnly], async (req, res) => {
  try {
    const { panelistName, feedback } = req.body;

    const schedule = await prisma.smcMeeting.findUnique({
      where: { id: req.params.id },
      include: { startup: true }
    });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Update schedule
    const updatedSchedule = await prisma.smcMeeting.update({
      where: { id: req.params.id },
      data: {
        status: 'Completed',
        panelistName,
        feedback,
        completedAt: new Date()
      },
      include: {
        startup: true
      }
    });

    // Auto-progress startup stage
    const currentStage = schedule.startup.stage;
    let newStage = currentStage;
    
    if (currentStage === 'S0') newStage = 'S1';
    else if (currentStage === 'S1') newStage = 'S2';
    else if (currentStage === 'S2') newStage = 'S3';

    if (newStage !== currentStage) {
      await prisma.startup.update({
        where: { id: schedule.startupId },
        data: { stage: newStage }
      });
    }

    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/smc/:id
// @desc    Delete SMC schedule
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    await prisma.smcMeeting.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
