const express = require('express');
const Announcements = require('../models/announcements');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /announcements - Get all announcements (for landing page)
router.get('/', async (req, res, next) => {
  try {
    const { type, special, church_id, weekly } = req.query;
    
    let announcements;
    if (weekly === 'true' && church_id) {
      announcements = await Announcements.findWeeklyByChurch(church_id);
    } else if (type) {
      announcements = await Announcements.findByType(type);
    } else if (special === 'true') {
      announcements = await Announcements.findSpecial();
    } else if (church_id) {
      announcements = await Announcements.findAllByChurch(church_id);
    } else {
      announcements = await Announcements.findAll();
    }
    
    res.json(announcements);
  } catch (err) {
    next(err);
  }
});

// GET /announcements/:id - Get specific announcement
router.get('/:id', async (req, res, next) => {
  try {
    const announcement = await Announcements.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

// POST /announcements - Create new announcement
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { church_id, ...data } = req.body;
    if (!church_id) {
      return res.status(400).json({ error: 'church_id is required' });
    }
    
    const announcement = await Announcements.create(church_id, data);
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
});

// PUT /announcements/:id - Update announcement
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const announcement = await Announcements.update(req.params.id, req.body);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json(announcement);
  } catch (err) {
    next(err);
  }
});

// DELETE /announcements/:id - Delete announcement
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await Announcements.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
