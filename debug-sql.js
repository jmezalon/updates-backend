// Debug script to test SQL queries and find the syntax error
const dbWrapper = require('./db-wrapper');

async function testQueries() {
  try {
    console.log('Testing database wrapper with PostgreSQL...');
    
    await dbWrapper.initialize();
    console.log('✓ Database initialized');
    
    // Test 1: Simple SELECT query (used in validatePassword)
    console.log('\n1. Testing validatePassword query...');
    try {
      const result = await dbWrapper.get('SELECT * FROM users WHERE email = ?', ['test@example.com']);
      console.log('✓ validatePassword query works');
    } catch (err) {
      console.error('✗ validatePassword query failed:', err.message);
      console.error('Full error:', err);
    }
    
    // Test 2: JOIN query (used in getChurchAssignments)
    console.log('\n2. Testing getChurchAssignments query...');
    try {
      const result = await dbWrapper.all(`
        SELECT ca.*, c.name as church_name 
        FROM church_admin_assignments ca
        JOIN churches c ON ca.church_id = c.id
        WHERE ca.user_id = ?
      `, [1]);
      console.log('✓ getChurchAssignments query works');
    } catch (err) {
      console.error('✗ getChurchAssignments query failed:', err.message);
      console.error('Full error:', err);
    }
    
    // Test 3: Check query conversion
    console.log('\n3. Testing query conversion...');
    const testQuery = 'SELECT * FROM users WHERE email = ?';
    const converted = dbWrapper.convertQuery(testQuery, ['test@example.com']);
    console.log('Original query:', testQuery);
    console.log('Converted query:', converted.query);
    console.log('Parameters:', converted.params);
    
  } catch (err) {
    console.error('Database wrapper test failed:', err);
  }
}

testQueries();
