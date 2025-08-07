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
      // Parse the connection string to override SSL settings
      const connectionString = process.env.DATABASE_URL;
      
      // Remove SSL parameters from connection string if they exist
      const cleanConnectionString = connectionString
        .replace(/[?&]sslmode=[^&]*/g, '')
        .replace(/[?&]ssl=true[&]?/g, '')
        .replace(/[?&]sslcert=[^&]*/g, '')
        .replace(/[?&]sslkey=[^&]*/g, '')
        .replace(/[?&]sslrootcert=[^&]*/g, '');
      
      pool = new Pool({
        connectionString: cleanConnectionString,
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined
        }
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
