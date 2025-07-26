const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const users = require('../models/users');
const { sendPasswordResetEmail } = require('../services/emailService');

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Validate user credentials
    const user = await users.validatePassword(email, password);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Get user's church assignments
    const churchAssignments = await users.getChurchAssignments(user.id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        ...user,
        churchAssignments
      }
    });
    
  } catch (err) {
    next(err);
  }
});

// POST /auth/register (for creating new admin accounts)
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role = 'church_admin' } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await users.getByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }
    
    // Validate role
    const validRoles = ['superuser', 'church_admin', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role specified' 
      });
    }
    
    // Create new user
    const newUser = await users.create({
      email,
      password,
      name,
      role
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser
    });
    
  } catch (err) {
    next(err);
  }
});

// POST /auth/verify-token
router.post('/verify-token', async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const user = await users.getById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found' 
      });
    }
    
    // Get user's church assignments
    const churchAssignments = await users.getChurchAssignments(user.id);
    
    res.json({
      valid: true,
      user: {
        ...user,
        churchAssignments
      }
    });
    
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid or expired token' 
      });
    }
    next(err);
  }
});

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token' 
      });
    }
    
    req.user = decoded;
    next();
  });
};

// GET /auth/profile (protected route example)
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await users.getById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    // Get user's church assignments
    const churchAssignments = await users.getChurchAssignments(user.id);
    
    res.json({
      ...user,
      churchAssignments
    });
    
  } catch (err) {
    next(err);
  }
});

// POST /auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;
    
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }
    
    // Get user from database with password hash
    const user = await users.getByIdWithPassword(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await users.updatePassword(userId, newPasswordHash);
    
    
    res.json({ message: 'Password changed successfully' });
    
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ 
      error: 'Internal server error while changing password. Please try again.' 
    });
  }
});

// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }
    
    // Check if user exists
    const user = await users.getByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Check rate limiting (1 request per hour)
    const canRequest = await users.canRequestPasswordReset(email);
    if (!canRequest) {
      return res.status(429).json({ 
        error: 'Password reset already requested. Please wait 1 hour before requesting again.' 
      });
    }
    
    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes from now
    
    // Save reset token to database
    await users.setPasswordResetToken(email, resetToken, expiresAt);
    
    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, user.name, resetToken);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send password reset email. Please try again later.' 
      });
    }
    
    
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    });
    
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
});

// GET /auth/verify-reset-token - Verify reset token validity
router.get('/verify-reset-token', async (req, res, next) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        error: 'Reset token is required' 
      });
    }
    
    // Find user by reset token
    const user = await users.getByPasswordResetToken(token);
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Check if token has expired
    if (Date.now() > user.password_reset_expires) {
      // Clean up expired token
      await users.clearPasswordResetToken(user.id);
      return res.status(400).json({ 
        error: 'Reset token has expired. Please request a new one.' 
      });
    }
    
    res.json({ 
      valid: true,
      email: user.email,
      name: user.name
    });
    
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
});

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Reset token and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
      });
    }
    
    // Find user by reset token
    const user = await users.getByPasswordResetToken(token);
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Check if token has expired
    if (Date.now() > user.password_reset_expires) {
      // Clean up expired token
      await users.clearPasswordResetToken(user.id);
      return res.status(400).json({ 
        error: 'Reset token has expired. Please request a new one.' 
      });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token (single-use)
    await users.updatePassword(user.id, newPasswordHash);
    await users.clearPasswordResetToken(user.id);
    
    
    res.json({ 
      message: 'Password reset successfully. You can now log in with your new password.' 
    });
    
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
});

// PUT /auth/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const userId = req.user.userId;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        error: 'Name is required' 
      });
    }
    
    // Update user profile
    const updatedUser = await users.update(userId, {
      name: name.trim(),
      avatar: avatar || null
    });
    
    res.json(updatedUser);
    
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ 
      error: 'Failed to update profile' 
    });
  }
});

// DELETE /auth/account - Delete user account
router.delete('/account', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Delete user account
    await users.remove(userId);
    
    res.json({ message: 'Account deleted successfully' });
    
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ 
      error: 'Failed to delete account' 
    });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
