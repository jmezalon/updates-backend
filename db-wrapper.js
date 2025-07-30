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
    console.log('DatabaseWrapper.all() called with query:', query);
    const result = await this.query(query, params);
    return result.rows || [];
  }

  async get(query, params = []) {
    console.log('DatabaseWrapper.get() called with query:', query);
    const result = await this.query(query, params);
    return result.rows[0] || null;
  }

  async run(query, params = []) {
    const result = await this.query(query, params);
    if (this.isPostgres) {
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0
      };
    } else {
      return {
        lastID: result.lastID,
        changes: result.changes
      };
    }
  }

  // Helper method for INSERT queries that need to return the inserted ID
  async insert(query, params = []) {
    if (this.isPostgres) {
      // Add RETURNING id to PostgreSQL INSERT queries
      const trimmedQuery = query.trim();
      let returningQuery;
      
      if (trimmedQuery.includes('RETURNING')) {
        returningQuery = trimmedQuery;
      } else {
        // Remove trailing semicolon if present, add RETURNING id, then add semicolon back
        const cleanQuery = trimmedQuery.replace(/;\s*$/, '');
        returningQuery = cleanQuery + ' RETURNING id';
      }
      
      const result = await this.query(returningQuery, params);
      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0
      };
    } else {
      const result = await this.query(query, params);
      return {
        lastID: result.lastID,
        changes: result.changes
      };
    }
  }

  // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc.)
  convertQuery(query, params = []) {
    if (this.isPostgres && query.includes('?')) {
      let paramIndex = 1;
      // Trim the query and ensure proper formatting
      const trimmedQuery = query.trim();
      const convertedQuery = trimmedQuery.replace(/\?/g, () => `$${paramIndex++}`);
      return { query: convertedQuery, params };
    }
    // Always trim the query to prevent whitespace issues
    return { query: query.trim(), params };
  }

  async query(query, params = []) {
    const { query: convertedQuery, params: convertedParams } = this.convertQuery(query, params);
    
    if (this.isPostgres) {
      // Log the exact query being executed for debugging
      console.log('PostgreSQL Query:', convertedQuery);
      console.log('Parameters:', convertedParams);
      try {
        return await this.db.query(convertedQuery, convertedParams);
      } catch (error) {
        console.error('PostgreSQL Query Error:', error.message);
        console.error('Failed Query:', convertedQuery);
        console.error('Failed Parameters:', convertedParams);
        throw error;
      }
    } else {
      // For SQLite, determine the appropriate method based on query type
      const queryType = convertedQuery.trim().toUpperCase();
      if (queryType.startsWith('SELECT')) {
        if (convertedQuery.toUpperCase().includes('LIMIT 1')) {
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
