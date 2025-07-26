const express = require('express');
const router = express.Router();
const churches = require('../models/churches');
const users = require('../models/users');
const { authenticateToken } = require('./auth');

// POST /enrollment/submit-church (protected - church_admin only)
router.post('/submit-church', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is church_admin
    if (req.user.role !== 'church_admin') {
      return res.status(403).json({ 
        error: 'Access denied. Church admin role required.' 
      });
    }

    const {
      churchName,
      pastorName,
      address,
      city,
      state,
      zip,
      contactEmail,
      contactPhone,
      website,
      description
    } = req.body;

    // Validate required fields
    if (!churchName || !pastorName) {
      return res.status(400).json({ 
        error: 'Church name and pastor name are required' 
      });
    }

    // Create the church record
    const churchData = {
      name: churchName,
      senior_pastor: pastorName,
      pastor: pastorName, // For backward compatibility
      address,
      city,
      state,
      zip,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      website,
      description
    };

    const churchId = await churches.create(churchData);

    // Update user enrollment status to 'pending'
    await users.updateEnrollmentStatus(req.user.userId, 'pending');

    // In a real application, this would send an email notification to superuser
    console.log(`🏛️ New church enrollment submitted:`, {
      churchId,
      churchName,
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: req.user.name
    });

    res.status(201).json({ 
      message: 'Church enrollment submitted successfully',
      churchId,
      status: 'pending'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
