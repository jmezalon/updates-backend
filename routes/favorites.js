const express = require('express');
const router = express.Router();
const users = require('../models/users');
const { authenticateToken } = require('./auth');

// Church Following Routes

// Follow a church
router.post('/churches/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    await users.followChurch(userId, id);
    res.status(201).json({ 
      message: 'Successfully followed church',
      isFollowing: true 
    });
  } catch (error) {
    if (error.message.includes('already following') || error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'User is already following this church' });
    }
    console.error('Error following church:', error);
    res.status(500).json({ error: 'Failed to follow church' });
  }
});

// Unfollow a church
router.delete('/churches/:id/follow', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const success = await users.unfollowChurch(userId, id);
    if (success) {
      res.json({ 
        message: 'Successfully unfollowed church',
        isFollowing: false 
      });
    } else {
      res.status(404).json({ error: 'Church not followed by user' });
    }
  } catch (error) {
    console.error('Error unfollowing church:', error);
    res.status(500).json({ error: 'Failed to unfollow church' });
  }
});

// Check if user is following a church
router.get('/churches/:id/follow/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const isFollowing = await users.isFollowingChurch(userId, id);
    res.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get user's followed churches
router.get('/churches/followed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const churches = await users.getFollowedChurches(userId);
    res.json(churches);
  } catch (error) {
    console.error('Error getting followed churches:', error);
    res.status(500).json({ error: 'Failed to get followed churches' });
  }
});

// Event Liking Routes

// Like an event
router.post('/events/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    await users.likeEvent(userId, id);
    res.status(201).json({ 
      message: 'Successfully liked event',
      isLiked: true 
    });
  } catch (error) {
    if (error.message.includes('already liked') || error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'User has already liked this event' });
    }
    console.error('Error liking event:', error);
    res.status(500).json({ error: 'Failed to like event' });
  }
});

// Unlike an event
router.delete('/events/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const success = await users.unlikeEvent(userId, id);
    if (success) {
      res.json({ 
        message: 'Successfully unliked event',
        isLiked: false 
      });
    } else {
      res.status(404).json({ error: 'Event not liked by user' });
    }
  } catch (error) {
    console.error('Error unliking event:', error);
    res.status(500).json({ error: 'Failed to unlike event' });
  }
});

// Check if user has liked an event
router.get('/events/:id/like/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    const isLiked = await users.isLikingEvent(userId, id);
    res.json({ isLiked });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

// Get all liked events for a user
router.get('/events/liked', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Getting liked events for user:', req.user.userId);
    console.log('🔍 User object:', req.user);
    
    const events = await users.getLikedEvents(req.user.userId);
    console.log('✅ Successfully got liked events:', events.length, 'events');
    res.json(events);
  } catch (error) {
    console.error('❌ Error getting liked events:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get liked events' });
  }
});

// Combined favorites endpoint for the favorites tab
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [followedChurches, likedEvents] = await Promise.all([
      users.getFollowedChurches(userId),
      users.getLikedEvents(userId)
    ]);
    
    res.json({
      followedChurches,
      likedEvents,
      counts: {
        followedChurches: followedChurches.length,
        likedEvents: likedEvents.length
      }
    });
  } catch (error) {
    console.error('Error getting combined favorites:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

module.exports = router;
