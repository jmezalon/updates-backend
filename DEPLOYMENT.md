# Backend Deployment Guide

## Environment Variables Required for Production

Set these environment variables in your deployment platform:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-here
DB_PATH=/app/updates.db
CORS_ORIGIN=https://your-admin-portal-domain.com
```

## Deployment Platforms

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Render
1. Connect GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables

### DigitalOcean App Platform
1. Create new app from GitHub
2. Set environment variables
3. Configure auto-deploy

## Database
- SQLite database will be created automatically
- Database file persists in the deployment environment
- Initial schema and seed data will be set up on first run

## File Uploads
- Uploads directory will be created automatically
- Files are stored locally in the deployment environment
- Consider using cloud storage (AWS S3, Cloudinary) for production scaling

## Health Check
- Server runs on PORT environment variable or 3000
- Health check endpoint: `GET /api/auth/verify-token`
