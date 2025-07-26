# Updates App Backend (v1)

Backend for the Updates app. Built with Express and PostgreSQL.

## Features
- Manage churches, events, announcements, ministries, and members
- Superuser and per-church admin permissions
- Ready for Postman testing
- Includes integration tests (Jest)

## Setup
1. Install dependencies: `npm install`
2. Set up PostgreSQL and run `seed.sql` to initialize the database
3. Configure your `.env` file (see `.env.example`)
4. Start the server: `npm start`
5. Run tests: `npm test`

## Directory Structure
- `/models` - Database queries
- `/routes` - Express routers
- `/middleware` - Permissions, error handling
- `/tests` - Endpoint tests
- `db.js` - Database connection
- `seed.sql` - Dummy data

## API Endpoints
See Postman collection or Swagger docs (TBD)
