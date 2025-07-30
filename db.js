require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { Pool } = require('pg');
const path = require('path');

let db;
let pool;

const initializeDatabase = async () => {
  if (process.env.DATABASE_URL) {
    // Use PostgreSQL for production (Heroku)
    if (!pool) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      console.log('Connected to PostgreSQL database');
    }
    return pool;
  } else {
    // Use SQLite for local development
    if (!db) {
      db = await open({
        filename: path.join(__dirname, 'updates.db'),
        driver: sqlite3.Database
      });
      console.log('Connected to SQLite database');
    }
    return db;
  }
};

const getDb = () => {
  return process.env.DATABASE_URL ? pool : db;
};

module.exports = { initializeDatabase, getDb };
