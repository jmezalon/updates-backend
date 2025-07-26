const express = require('express');
const router = express.Router();
const events = require('../models/events');

// GET /events - Get all events across all churches for home view
router.get('/', async (req, res, next) => {
  try {
    const allEvents = await events.getAll();
    res.json(allEvents);
  } catch (err) {
    next(err);
  }
});

// GET /events/:id - Get a specific event by ID with church details
router.get('/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    const allEvents = await events.getAll();
    const event = allEvents.find(e => e.id === eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
