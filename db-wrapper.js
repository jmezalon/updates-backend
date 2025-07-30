const { initializeDatabase } = require('./db');

class DatabaseWrapper {
  constructor() {
    this.db = null;
    this.isPostgres = false;
  }

  async initialize() {
    this.db = await initializeDatabase();
    this.isPostgres = !!process.env.DATABASE_URL;
  }

  async all(query, params = []) {
    if (this.isPostgres) {
      const result = await this.db.query(query, params);
      return result.rows;
    } else {
      return await this.db.all(query, params);
    }
  }

  async get(query, params = []) {
    if (this.isPostgres) {
      const result = await this.db.query(query, params);
      return result.rows[0] || null;
    } else {
      return await this.db.get(query, params);
    }
  }

  async run(query, params = []) {
    if (this.isPostgres) {
      const result = await this.db.query(query, params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0
      };
    } else {
      return await this.db.run(query, params);
    }
  }

  // Helper method for INSERT queries that need to return the inserted ID
  async insert(query, params = []) {
    if (this.isPostgres) {
      // Add RETURNING id to PostgreSQL INSERT queries
      const returningQuery = query.includes('RETURNING') ? query : query + ' RETURNING id';
      const result = await this.db.query(returningQuery, params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0
      };
    } else {
      return await this.db.run(query, params);
    }
  }

  // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
  convertQuery(query, params = []) {
    if (this.isPostgres && query.includes('?')) {
      let paramIndex = 1;
      const convertedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
      return { query: convertedQuery, params };
    }
    return { query, params };
  }

  async query(query, params = []) {
    const { query: convertedQuery, params: convertedParams } = this.convertQuery(query, params);
    
    if (this.isPostgres) {
      return await this.db.query(convertedQuery, convertedParams);
    } else {
      // For SQLite, determine the appropriate method based on query type
      const queryType = convertedQuery.trim().toUpperCase();
      if (queryType.startsWith('SELECT')) {
        if (convertedQuery.includes('LIMIT 1') || queryType.includes('WHERE') && !queryType.includes('ORDER BY')) {
          return { rows: [await this.db.get(convertedQuery, convertedParams)] };
        } else {
          return { rows: await this.db.all(convertedQuery, convertedParams) };
        }
      } else {
        const result = await this.db.run(convertedQuery, convertedParams);
        return { rows: [], rowCount: result.changes, lastID: result.lastID };
      }
    }
  }
}

// Create a singleton instance
const dbWrapper = new DatabaseWrapper();

module.exports = dbWrapper;
