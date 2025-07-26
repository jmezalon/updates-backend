const express = require('express');
const router = express.Router();
const users = require('../models/users');
const { authenticateToken } = require('./auth');

// GET /users (protected - superuser only)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is superuser
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. Superuser role required.' 
      });
    }
    
    const allUsers = await users.getAll();
    
    // Add church assignments for each user
    const usersWithAssignments = await Promise.all(
      allUsers.map(async (user) => {
        const churchAssignments = await users.getChurchAssignments(user.id);
        return {
          ...user,
          churchAssignments
        };
      })
    );
    
    res.json(usersWithAssignments);
  } catch (err) {
    next(err);
  }
});

// GET /users/:id (protected - superuser or own profile)
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is accessing their own profile or is superuser
    if (req.user.userId !== userId && req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. You can only access your own profile.' 
      });
    }
    
    const user = await users.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's church assignments
    const churchAssignments = await users.getChurchAssignments(userId);
    
    res.json({
      ...user,
      churchAssignments
    });
  } catch (err) {
    next(err);
  }
});

// PUT /users/:id (protected - superuser or own profile)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is updating their own profile or is superuser
    if (req.user.userId !== userId && req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own profile.' 
      });
    }
    
    // Don't allow non-superusers to change their role
    if (req.user.role !== 'superuser' && req.body.role) {
      return res.status(403).json({ 
        error: 'Access denied. You cannot change your own role.' 
      });
    }
    
    const updated = await users.update(userId, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:id (protected - superuser or own account)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user is deleting their own account or is superuser
    if (req.user.userId !== userId && req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. You can only delete your own account.' 
      });
    }
    
    await users.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /users/:id/assign-church (protected - superuser only)
router.post('/:id/assign-church', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is superuser
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. Superuser role required.' 
      });
    }
    
    const { churchId } = req.body;
    if (!churchId) {
      return res.status(400).json({ 
        error: 'Church ID is required' 
      });
    }
    
    const assignmentId = await users.assignToChurch(req.params.id, churchId);
    res.status(201).json({ 
      message: 'User assigned to church successfully',
      assignmentId 
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:id/assign-church/:churchId (protected - superuser only)
router.delete('/:id/assign-church/:churchId', authenticateToken, async (req, res, next) => {
  try {
    // Check if user is superuser
    if (req.user.role !== 'superuser') {
      return res.status(403).json({ 
        error: 'Access denied. Superuser role required.' 
      });
    }
    
    await users.removeChurchAssignment(req.params.id, req.params.churchId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
