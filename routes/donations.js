const express = require('express');
const Donations = require('../models/donations');
const router = express.Router({ mergeParams: true });

// GET /churches/:churchId/donations
router.get('/', async (req, res, next) => {
  try {
    const { churchId } = req.params;
    const donations = await Donations.findAllByChurch(churchId);
    res.json(donations);
  } catch (err) {
    next(err);
  }
});

// POST /churches/:churchId/donations
router.post('/', async (req, res, next) => {
  try {
    const { churchId } = req.params;
    const donation = await Donations.create(churchId, req.body);
    res.status(201).json(donation);
  } catch (err) {
    next(err);
  }
});

// PUT /churches/:churchId/donations/:donationId
router.put('/:donationId', async (req, res, next) => {
  try {
    const updated = await Donations.update(req.params.donationId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /churches/:churchId/donations/:donationId
router.delete('/:donationId', async (req, res, next) => {
  try {
    await Donations.remove(req.params.donationId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
