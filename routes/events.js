const express = require('express');
const router = express.Router({ mergeParams: true });
const events = require('../models/events');
const { authenticateToken } = require('./auth');

// GET /churches/:churchId/events (mounted at /churches/:churchId/events)
router.get('/', async (req, res, next) => {
  try {
    const all = await events.getAllByChurch(req.params.churchId);
    res.json(all);
  } catch (err) {
    next(err);
  }
});

// GET /events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await events.getById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// POST /churches/:churchId/events (mounted at /churches/:churchId/events)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const newEvent = await events.create(req.params.churchId, req.body);
    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /events/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const updated = await events.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /events/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    await events.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
