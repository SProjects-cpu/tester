import express from 'express';
import prisma from '../utils/prisma.js';

const router = express.Router();

// GET all startups
router.get('/', async (req, res) => {
  try {
    const { stage } = req.query;
    
    const startups = await prisma.startup.findMany({
      where: stage ? { stage } : undefined,
      include: {
        achievements: true,
        progressHistory: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(startups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    res.status(500).json({ error: 'Failed to fetch startups' });
  }
});

// GET single startup by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const startup = await prisma.startup.findUnique({
      where: { id },
      include: {
        achievements: {
          orderBy: { date: 'desc' },
        },
        progressHistory: {
          orderBy: { date: 'desc' },
        },
        oneOnOneMeetings: {
          orderBy: { date: 'desc' },
        },
        smcMeetings: {
          orderBy: { date: 'desc' },
        },
        agreements: {
          orderBy: { uploadDate: 'desc' },
        },
      },
    });

    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    res.json(startup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    res.status(500).json({ error: 'Failed to fetch startup' });
  }
});

// POST create new startup
router.post('/', async (req, res) => {
  try {
    const startupData = req.body;

    const startup = await prisma.startup.create({
      data: {
        name: startupData.name,
        founder: startupData.founder,
        email: startupData.email,
        phone: startupData.phone,
        sector: startupData.sector,
        stage: startupData.stage || 'Onboarded',
        description: startupData.description,
        website: startupData.website,
        fundingReceived: startupData.fundingReceived || 0,
        employeeCount: startupData.employeeCount || 0,
        revenueGenerated: startupData.revenueGenerated || 0,
      },
    });

    res.status(201).json(startup);
  } catch (error) {
    console.error('Error creating startup:', error);
    res.status(500).json({ error: 'Failed to create startup' });
  }
});

// PUT update startup
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const startup = await prisma.startup.update({
      where: { id },
      data: updateData,
    });

    res.json(startup);
  } catch (error) {
    console.error('Error updating startup:', error);
    res.status(500).json({ error: 'Failed to update startup' });
  }
});

// DELETE startup
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.startup.delete({
      where: { id },
    });

    res.json({ message: 'Startup deleted successfully' });
  } catch (error) {
    console.error('Error deleting startup:', error);
    res.status(500).json({ error: 'Failed to delete startup' });
  }
});

// POST add achievement to startup
router.post('/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const achievementData = req.body;

    const achievement = await prisma.achievement.create({
      data: {
        startupId: id,
        title: achievementData.title,
        description: achievementData.description,
        type: achievementData.type,
        date: achievementData.date ? new Date(achievementData.date) : new Date(),
        mediaUrl: achievementData.mediaUrl,
        isGraduated: achievementData.isGraduated || false,
      },
    });

    res.status(201).json(achievement);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ error: 'Failed to add achievement' });
  }
});

// POST add progress history
router.post('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const progressData = req.body;

    const progress = await prisma.progressHistory.create({
      data: {
        startupId: id,
        metric: progressData.metric,
        value: progressData.value,
        date: progressData.date ? new Date(progressData.date) : new Date(),
        notes: progressData.notes,
      },
    });

    res.status(201).json(progress);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ error: 'Failed to add progress' });
  }
});

export default router;
