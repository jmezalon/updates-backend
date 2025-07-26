const express = require('express');
const router = express.Router();
const churches = require('../models/churches');
const { authenticateToken } = require('./auth');

// GET /churches
router.get('/', async (req, res, next) => {
  try {
    const all = await churches.getAll();
    res.json(all);
  } catch (err) {
    next(err);
  }
});

// GET /churches/:id
router.get('/:id', async (req, res, next) => {
  try {
    const church = await churches.getById(req.params.id);
    if (!church) return res.status(404).json({ error: 'Church not found' });
    res.json(church);
  } catch (err) {
    next(err);
  }
});

// POST /churches
router.post('/', async (req, res, next) => {
  try {
    const newChurch = await churches.create(req.body);
    res.status(201).json(newChurch);
  } catch (err) {
    next(err);
  }
});

// PUT /churches/:id
router.put('/:id', async (req, res, next) => {
  try {
    const updated = await churches.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /churches/:id (protected - superuser only)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is superuser
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. Superuser role required.' 
      });
    }

    const result = await churches.remove(req.params.id);
    res.json({
      message: 'Church deleted successfully',
      removedAssignments: result.removedAssignments
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
