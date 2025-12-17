import express from 'express';
import { body } from 'express-validator';
import { startupsDB } from '../utils/db.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// @route   GET /api/startups
// @desc    Get all startups
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { stage, status, search } = req.query;
    let startups = startupsDB.findAll();

    if (stage) {
      startups = startups.filter(s => s.stage === stage);
    }
    if (status) {
      startups = startups.filter(s => s.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      startups = startups.filter(s => 
        s.companyName?.toLowerCase().includes(searchLower) ||
        s.magicCode?.toLowerCase().includes(searchLower) ||
        s.founderName?.toLowerCase().includes(searchLower)
      );
    }

    startups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(startups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startups/:id
// @desc    Get startup by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const startup = startupsDB.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    res.json(startup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups
// @desc    Create new startup
// @access  Private (Admin only)
router.post('/', [
  protect,
  adminOnly,
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile is required'),
  validate
], async (req, res) => {
  try {
    // Check if email already exists
    const existing = startupsDB.findOne({ email: req.body.email });
    if (existing) {
      return res.status(400).json({ message: 'Startup with this email already exists' });
    }

    // Generate MAGIC code
    const count = startupsDB.count();
    const magicCode = `MAGIC${String(count + 1).padStart(3, '0')}`;

    const startup = startupsDB.create({
      ...req.body,
      magicCode,
      registeredDate: req.body.registeredDate || new Date().toISOString().split('T')[0],
      stage: req.body.stage || 'S0',
      status: req.body.status || 'Active',
      pitchHistory: [],
      oneOnOneHistory: [],
      achievements: [],
      documents: []
    });

    res.status(201).json(startup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/startups/:id
// @desc    Update startup
// @access  Private (Admin only)
router.put('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const startup = startupsDB.update(req.params.id, req.body);

    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    res.json(startup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/startups/:id
// @desc    Delete startup
// @access  Private (Admin only)
router.delete('/:id', [protect, adminOnly], async (req, res) => {
  try {
    const deleted = startupsDB.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Startup not found' });
    }
    res.json({ message: 'Startup deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups/:id/pitch
// @desc    Add pitch history
// @access  Private (Admin only)
router.post('/:id/pitch', [protect, adminOnly], async (req, res) => {
  try {
    const startup = startupsDB.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.pitchHistory = startup.pitchHistory || [];
    startup.pitchHistory.push(req.body);
    
    const updated = startupsDB.update(req.params.id, startup);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/startups/:id/upload
// @desc    Upload document
// @access  Private (Admin only)
router.post('/:id/upload', [protect, adminOnly, upload.single('document')], async (req, res) => {
  try {
    const startup = startupsDB.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ message: 'Startup not found' });
    }

    startup.documents = startup.documents || [];
    startup.documents.push({
      name: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString()
    });

    const updated = startupsDB.update(req.params.id, startup);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/startups/stats/overview
// @desc    Get startup statistics
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const startups = startupsDB.findAll();
    
    const stageStats = {};
    const statusStats = {};

    startups.forEach(startup => {
      stageStats[startup.stage] = (stageStats[startup.stage] || 0) + 1;
      statusStats[startup.status] = (statusStats[startup.status] || 0) + 1;
    });

    const stageStatsArray = Object.entries(stageStats).map(([_id, count]) => ({ _id, count }));
    const statusStatsArray = Object.entries(statusStats).map(([_id, count]) => ({ _id, count }));

    res.json({ stageStats: stageStatsArray, statusStats: statusStatsArray });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
