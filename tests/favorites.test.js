const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { initializeDatabase } = require('../db');
const favoritesRouter = require('../routes/favorites');

const app = express();
app.use(express.json());
app.use('/favorites', favoritesRouter);

// JWT secret - should match the one in auth.js
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to create a valid JWT token for testing
const createTestToken = (userId = 28, email = 'test@example.com', role = 'user') => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

describe('Favorites API', () => {
  let testToken;
  
  beforeAll(async () => {
    // Initialize database connection for tests
    await initializeDatabase();
    // Create a test token for authenticated requests
    testToken = createTestToken();
    console.log('Test token created:', testToken);
  });

  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app)
        .post('/favorites/events/1/like');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Access token required');
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .post('/favorites/events/1/like')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Event Liking', () => {
    it('should like an event with valid token', async () => {
      const res = await request(app)
        .post('/favorites/events/1/like')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Like event response:', res.statusCode, res.body);
      
      // We expect either success (201) or conflict (409) if already liked
      expect([201, 409]).toContain(res.statusCode);
      
      if (res.statusCode === 201) {
        expect(res.body.message).toBe('Successfully liked event');
        expect(res.body.isLiked).toBe(true);
      } else if (res.statusCode === 409) {
        expect(res.body.error).toBe('User has already liked this event');
      }
    });

    it('should check like status for an event', async () => {
      const res = await request(app)
        .get('/favorites/events/1/like/status')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Like status response:', res.statusCode, res.body);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isLiked');
      expect(typeof res.body.isLiked).toBe('boolean');
    });

    it('should unlike an event', async () => {
      // First like the event
      await request(app)
        .post('/favorites/events/2/like')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Then unlike it
      const res = await request(app)
        .delete('/favorites/events/2/like')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Unlike event response:', res.statusCode, res.body);
      
      // We expect either success (200) or not found (404) if not liked
      expect([200, 404]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body.message).toBe('Successfully unliked event');
        expect(res.body.isLiked).toBe(false);
      }
    });
  });

  describe('Church Following', () => {
    it('should follow a church with valid token', async () => {
      const res = await request(app)
        .post('/favorites/churches/1/follow')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Follow church response:', res.statusCode, res.body);
      
      // We expect either success (201) or conflict (409) if already following
      expect([201, 409]).toContain(res.statusCode);
      
      if (res.statusCode === 201) {
        expect(res.body.message).toBe('Successfully followed church');
        expect(res.body.isFollowing).toBe(true);
      } else if (res.statusCode === 409) {
        expect(res.body.error).toBe('User is already following this church');
      }
    });

    it('should check follow status for a church', async () => {
      const res = await request(app)
        .get('/favorites/churches/1/follow/status')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Follow status response:', res.statusCode, res.body);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('isFollowing');
      expect(typeof res.body.isFollowing).toBe('boolean');
    });

    it('should unfollow a church', async () => {
      // First follow the church
      await request(app)
        .post('/favorites/churches/2/follow')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Then unfollow it
      const res = await request(app)
        .delete('/favorites/churches/2/follow')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Unfollow church response:', res.statusCode, res.body);
      
      // We expect either success (200) or not found (404) if not following
      expect([200, 404]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body.message).toBe('Successfully unfollowed church');
        expect(res.body.isFollowing).toBe(false);
      }
    });
  });

  describe('Combined Favorites', () => {
    it('should get all user favorites', async () => {
      const res = await request(app)
        .get('/favorites/all')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('All favorites response:', res.statusCode, res.body);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('followedChurches');
      expect(res.body).toHaveProperty('likedEvents');
      expect(res.body).toHaveProperty('counts');
      expect(Array.isArray(res.body.followedChurches)).toBe(true);
      expect(Array.isArray(res.body.likedEvents)).toBe(true);
    });

    it('should get followed churches', async () => {
      const res = await request(app)
        .get('/favorites/churches/followed')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Followed churches response:', res.statusCode, res.body);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get liked events', async () => {
      const res = await request(app)
        .get('/favorites/events/liked')
        .set('Authorization', `Bearer ${testToken}`);
      
      console.log('Liked events response:', res.statusCode, res.body);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('JWT Token Debugging', () => {
    it('should decode token correctly', () => {
      const decoded = jwt.verify(testToken, JWT_SECRET);
      console.log('Decoded token:', decoded);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded.userId).toBe(28);
      expect(decoded.role).toBe('user');
    });
  });
});
