import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/landing-page
// @desc    Get landing page content
// @access  Public
router.get('/', async (req, res) => {
  try {
    let landingPage = await prisma.setting.findUnique({
      where: { key: 'landingPage' }
    });
    
    if (!landingPage) {
      // Return default landing page content
      const defaultContent = {
        hero: {
          title: 'Welcome to MAGIC',
          subtitle: 'Empowering Startups in Marathwada',
          ctaText: 'Get Started'
        },
        features: [],
        stats: [],
        testimonials: [],
        contact: {}
      };
      
      return res.json(defaultContent);
    }

    res.json(JSON.parse(landingPage.value));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/landing-page
// @desc    Update landing page content
// @access  Private (Admin only)
router.put('/', [protect, adminOnly], async (req, res) => {
  try {
    const content = JSON.stringify(req.body);
    
    await prisma.setting.upsert({
      where: { key: 'landingPage' },
      update: { value: content },
      create: { key: 'landingPage', value: content, description: 'Landing page content' }
    });
    
    res.json(req.body);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
