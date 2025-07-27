/**
 * Database migration script to fix existing localhost image URLs
 * Run this script once to fix all existing localhost URLs in the database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'updates.db');

// Production base URL
const PRODUCTION_BASE_URL = 'https://updates-backend-api-beebc8cc747c.herokuapp.com';

function fixImageUrl(imageUrl) {
    if (!imageUrl) return imageUrl;
    
    const localhostPatterns = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'localhost:3000',
        '127.0.0.1:3000'
    ];
    
    // Replace localhost patterns with production URL
    for (const pattern of localhostPatterns) {
        if (imageUrl.includes(pattern)) {
            return imageUrl.replace(new RegExp(pattern, 'g'), PRODUCTION_BASE_URL);
        }
    }
    
    // If it's a relative path, make it absolute
    if (imageUrl.startsWith('/uploads/')) {
        return `${PRODUCTION_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
}

async function runMigration() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');
        });

        let totalUpdates = 0;

        // Function to update a table
        const updateTable = (tableName, column, callback) => {
            console.log(`\n🔍 Checking ${tableName}.${column} for localhost URLs...`);
            
            // First, get all records with localhost URLs
            db.all(`SELECT id, ${column} FROM ${tableName} WHERE ${column} LIKE '%localhost%' OR ${column} LIKE '%127.0.0.1%'`, (err, rows) => {
                if (err) {
                    console.error(`Error querying ${tableName}:`, err);
                    callback(err);
                    return;
                }

                if (rows.length === 0) {
                    console.log(`✅ No localhost URLs found in ${tableName}.${column}`);
                    callback(null);
                    return;
                }

                console.log(`📝 Found ${rows.length} records with localhost URLs in ${tableName}.${column}`);

                let updatedCount = 0;
                let processedCount = 0;

                rows.forEach(row => {
                    const originalUrl = row[column];
                    const fixedUrl = fixImageUrl(originalUrl);

                    if (originalUrl !== fixedUrl) {
                        // Update the record
                        db.run(`UPDATE ${tableName} SET ${column} = ? WHERE id = ?`, [fixedUrl, row.id], function(err) {
                            if (err) {
                                console.error(`Error updating ${tableName} record ${row.id}:`, err);
                            } else {
                                updatedCount++;
                                totalUpdates++;
                                console.log(`✅ Updated ${tableName}.${column} for ID ${row.id}:`);
                                console.log(`   From: ${originalUrl}`);
                                console.log(`   To:   ${fixedUrl}`);
                            }

                            processedCount++;
                            if (processedCount === rows.length) {
                                console.log(`✅ Completed ${tableName}.${column}: ${updatedCount}/${rows.length} records updated`);
                                callback(null);
                            }
                        });
                    } else {
                        processedCount++;
                        if (processedCount === rows.length) {
                            console.log(`✅ Completed ${tableName}.${column}: ${updatedCount}/${rows.length} records updated`);
                            callback(null);
                        }
                    }
                });
            });
        };

        // Tables and columns to update (based on actual schema)
        const updates = [
            { table: 'events', column: 'image_url' },
            { table: 'churches', column: 'logo_url' },
            { table: 'churches', column: 'banner_url' },
            { table: 'churches', column: 'senior_pastor_avatar' },
            { table: 'churches', column: 'pastor_avatar' },
            { table: 'churches', column: 'assistant_pastor_avatar' },
            { table: 'announcements', column: 'image_url' },
            { table: 'members', column: 'avatar_url' },
            { table: 'users', column: 'avatar' }
        ];

        let completedUpdates = 0;

        console.log('🚀 Starting image URL migration...\n');

        updates.forEach(({ table, column }) => {
            updateTable(table, column, (err) => {
                if (err) {
                    console.error(`Failed to update ${table}.${column}:`, err);
                    reject(err);
                    return;
                }

                completedUpdates++;
                if (completedUpdates === updates.length) {
                    // All updates completed, now verify
                    console.log('\n🔍 Verifying migration results...');
                    
                    const verificationQueries = updates.map(({ table, column }) => 
                        `SELECT '${table}.${column}' as location, COUNT(*) as count FROM ${table} WHERE ${column} LIKE '%localhost%' OR ${column} LIKE '%127.0.0.1%'`
                    ).join(' UNION ALL ');

                    db.all(verificationQueries, (err, results) => {
                        if (err) {
                            console.error('Error during verification:', err);
                            reject(err);
                            return;
                        }

                        console.log('\n📊 Verification Results:');
                        let remainingIssues = 0;
                        results.forEach(result => {
                            if (result.count > 0) {
                                console.log(`❌ ${result.location}: ${result.count} localhost URLs remaining`);
                                remainingIssues += result.count;
                            } else {
                                console.log(`✅ ${result.location}: No localhost URLs found`);
                            }
                        });

                        console.log(`\n🎉 Migration completed!`);
                        console.log(`📈 Total records updated: ${totalUpdates}`);
                        console.log(`${remainingIssues === 0 ? '✅ All localhost URLs have been fixed!' : `⚠️  ${remainingIssues} localhost URLs still remain`}`);

                        db.close((err) => {
                            if (err) {
                                console.error('Error closing database:', err);
                                reject(err);
                            } else {
                                console.log('Database connection closed.');
                                resolve();
                            }
                        });
                    });
                }
            });
        });
    });
}

// Run the migration
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('\n✅ Migration script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration, fixImageUrl };
