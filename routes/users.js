const express = require('express');
const router = express.Router();
const users = require('../models/users');
const { authenticateToken } = require('./auth');
const { sendChurchAssignmentNotification, sendAccountDeletionNotification } = require('../services/emailService');

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
    
    // Get user information before deletion for email notification
    const userToDelete = await users.getById(req.params.id);
    
    if (!userToDelete) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Delete the user account
    await users.remove(req.params.id);
    
    // Send account deletion notification email
    try {
      const emailResult = await sendAccountDeletionNotification(
        userToDelete.email,
        userToDelete.name
      );
      
      if (emailResult.success) {
        console.log('✅ Account deletion notification email sent successfully to:', userToDelete.email);
      } else {
        console.error('❌ Failed to send account deletion notification email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending account deletion notification email:', emailError);
      // Don't fail the deletion if email fails - account is already deleted
    }
    
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
    
    // Get user and church information for email notification
    try {
      const user = await users.getById(req.params.id);
      const churches = require('../models/churches');
      const church = await churches.getById(churchId);
      
      if (user && church) {
        // Send email notification to the user
        const emailResult = await sendChurchAssignmentNotification(
          user.email,
          user.name,
          church.name
        );
        
        if (emailResult.success) {
          console.log('✅ Church assignment notification email sent successfully to:', user.email);
        } else {
          console.error('❌ Failed to send church assignment notification email:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending church assignment notification email:', emailError);
      // Don't fail the assignment if email fails - just log the error
    }
    
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
