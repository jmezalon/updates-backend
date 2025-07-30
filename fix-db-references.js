// Quick script to replace all remaining database references
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

console.log('Fixing database references in model files...');

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already using dbWrapper
  if (content.includes('dbWrapper = require')) {
    console.log(`${file}: Already using dbWrapper`);
    return;
  }
  
  console.log(`Fixing ${file}...`);
  
  // Replace import
  content = content.replace(
    /const { getDb } = require\('\.\.\/db'\);/g,
    "const dbWrapper = require('../db-wrapper');"
  );
  
  // Replace getDb() calls
  content = content.replace(/const db = getDb\(\);/g, 'await dbWrapper.initialize();');
  content = content.replace(/const db = await getDb\(\);/g, 'await dbWrapper.initialize();');
  
  // Replace db method calls
  content = content.replace(/await db\.all\(/g, 'await dbWrapper.all(');
  content = content.replace(/await db\.get\(/g, 'await dbWrapper.get(');
  content = content.replace(/await db\.run\(/g, 'await dbWrapper.run(');
  
  // For INSERT operations that need RETURNING id
  content = content.replace(
    /await dbWrapper\.run\(\s*`INSERT INTO/g,
    'await dbWrapper.insert(`INSERT INTO'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`${file}: Fixed!`);
});

console.log('Database reference fixes complete!');
