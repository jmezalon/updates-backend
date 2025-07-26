require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

const initializeDatabase = async () => {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, 'updates.db'),
      driver: sqlite3.Database
    });
    console.log('Connected to SQLite database');
  }
  return db;
};

module.exports = { initializeDatabase, getDb: () => db };
