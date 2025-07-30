// Script to fix all remaining database references in users.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'models', 'users.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing all remaining database references in users.js...');

// Replace all remaining getDb() calls
content = content.replace(/const db = getDb\(\);/g, 'await dbWrapper.initialize();');
content = content.replace(/const db = await getDb\(\);/g, 'await dbWrapper.initialize();');

// Replace all db method calls
content = content.replace(/await db\.all\(/g, 'await dbWrapper.all(');
content = content.replace(/await db\.get\(/g, 'await dbWrapper.get(');
content = content.replace(/await db\.run\(/g, 'await dbWrapper.run(');

// For INSERT operations that need RETURNING id
content = content.replace(
  /await dbWrapper\.run\(\s*`INSERT INTO/g,
  'await dbWrapper.insert(`INSERT INTO'
);

fs.writeFileSync(filePath, content);
console.log('users.js: All database references fixed!');
