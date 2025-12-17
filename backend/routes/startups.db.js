import express from 'express';
import { body } from 'express-validator';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/startups
// @desc    Get all startups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { stage, search } = req.query;
    
    const where = {};
    if (stage) {
      where.stage = stage;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { founder: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const startups = await prisma.startup.findMany({
      where,
      include: {
        achievements: {
          orderBy: { date: 'desc' },
          take: 5
        },
        progressHistory: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(startups);
  } catch (error) {
    console.error('Error fetching startups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startups/:id
// @desc    Get startup by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const startup = await prisma.startup.findUnique({
      where: { id: req.params.id },
      include: {
        achievements: {
          orderBy: { date: 'desc' }
        },
        progressHistory: {
          orderBy: { date: 'desc' }
        },
        oneOnOneMeetings: {
          orderBy: { date: 'desc' }
        },
        smcMeetings: {
          orderBy: { date: 'desc' }
        },
        agreements: {
          orderBy: { uploadDate: 'desc' }
        }
      }
    });

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    res.json(startup);
  } catch (error) {
    console.error('Error fetching startup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups
// @desc    Create new startup
// @access  Private (Admin only)
router.post('/', [
  protect,
  adminOnly,
  body('name').trim().notEmpty().withMessage('Company name is required'),
  body('founder').trim().notEmpty().withMessage('Founder name is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('sector').trim().notEmpty().withMessage('Sector is required'),
  validate
], async (req, res) => {
  try {
    // Check if email already exists (if provided)
    if (req.body.email) {
      const existing = await prisma.startup.findFirst({
        where: { email: req.body.email }
      });
      if (existing) {
        return res.status(400).json({ message: 'Startup with this email already exists' });
      }
    }

    const startup = await prisma.startup.create({
      data: {
        name: req.body.name,
        founder: req.body.founder,
        email: req.body.email,
        phone: req.body.phone,
        sector: req.body.sector,
        stage: req.body.stage || 'Onboarded',
        description: req.body.description,
        website: req.body.website,
        fundingReceived: req.body.fundingReceived || 0,
        employeeCount: req.body.employeeCount || 0,
        revenueGenerated: req.body.revenueGenerated || 0,
        onboardedDate: req.body.onboardedDate ? new Date(req.body.onboardedDate) : new Date(),
        dpiitNo: req.body.dpiitNo,
        recognitionDate: req.body.recognitionDate ? new Date(req.body.recognitionDate) : null,
        bhaskarId: req.body.bhaskarId
      }
    });

    res.status(201).json(startup);
  } catch (error) {
    console.error('Error creating startup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/startups/:id
// @desc    Update startup
// @access  Private (Admin only)
router.put('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Convert date strings to Date objects if present
    if (updateData.onboardedDate) {
      updateData.onboardedDate = new Date(updateData.onboardedDate);
    }
    if (updateData.graduatedDate) {
      updateData.graduatedDate = new Date(updateData.graduatedDate);
    }
    if (updateData.recognitionDate) {
      updateData.recognitionDate = new Date(updateData.recognitionDate);
    }

    const startup = await prisma.startup.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(startup);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Startup not found' });
    }
    console.error('Error updating startup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/startups/:id
// @desc    Delete startup
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    await prisma.startup.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Startup deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Startup not found' });
    }
    console.error('Error deleting startup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups/:id/achievements
// @desc    Add achievement to startup
// @access  Private (Admin only)
router.post('/:id/achievements', [protect, adminOnly], async (req, res) => {
  try {
    const achievement = await prisma.achievement.create({
      data: {
        startupId: req.params.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        date: req.body.date ? new Date(req.body.date) : new Date(),
        mediaUrl: req.body.mediaUrl,
        isGraduated: req.body.isGraduated || false
      }
    });

    res.status(201).json(achievement);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups/:id/progress
// @desc    Add progress history
// @access  Private (Admin only)
router.post('/:id/progress', [protect, adminOnly], async (req, res) => {
  try {
    const progress = await prisma.progressHistory.create({
      data: {
        startupId: req.params.id,
        metric: req.body.metric,
        value: parseFloat(req.body.value),
        date: req.body.date ? new Date(req.body.date) : new Date(),
        notes: req.body.notes
      }
    });

    res.status(201).json(progress);
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups/:id/upload
// @desc    Upload document/agreement
// @access  Private (Admin only)
router.post('/:id/upload', [protect, adminOnly, upload.single('document')], async (req, res) => {
  try {
    const agreement = await prisma.agreement.create({
      data: {
        startupId: req.params.id,
        title: req.body.title || req.file.originalname,
        type: req.body.type || 'Document',
        fileUrl: `/uploads/${req.file.filename}`,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : null
      }
    });

    res.status(201).json(agreement);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startups/stats/overview
// @desc    Get startup statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const [stageStats, totalCount] = await Promise.all([
      prisma.startup.groupBy({
        by: ['stage'],
        _count: { stage: true }
      }),
      prisma.startup.count()
    ]);

    const formattedStats = stageStats.map(stat => ({
      _id: stat.stage,
      count: stat._count.stage
    }));

    res.json({ 
      stageStats: formattedStats,
      totalCount 
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
