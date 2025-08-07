const express = require('express');
const router = express.Router();
const events = require('../models/events');

// GET /events - Get all events across all churches for home view with pagination
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, church_id } = req.query;
    
    // Convert to numbers and validate
    const limitNum = Math.min(parseInt(limit) || 20, 50); // Max 50 per request
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    
    const allEvents = await events.getAllPaginated(limitNum, offsetNum, church_id);
    res.json(allEvents);
  } catch (err) {
    next(err);
  }
});

// GET /events/:id - Get a specific event by ID with church details
router.get('/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await events.getById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
