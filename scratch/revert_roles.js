require('dotenv').config();
const db = require('../config/db');

async function revert() {
    console.log('--- Reverting Database Roles to Proper Case ---');
    try {
        // 1. Revert roles in users table
        const usersUpdate = await db.query(`
            UPDATE users SET role = CASE 
                WHEN role = 'staff' THEN 'Faculty'
                WHEN role = 'guard' THEN 'Security Guard'
                WHEN role = 'admin' THEN 'Admin'
                WHEN role = 'student' THEN 'Student'
                WHEN role = 'worker' THEN 'Worker'
                ELSE role
            END;
        `);
        console.log(`✅ Users table roles reverted: ${usersUpdate.rowCount} rows`);

        // 2. Revert campus_issues
        const issuesUpdate = await db.query(`
            UPDATE campus_issues SET reporter_role = CASE 
                WHEN reporter_role = 'staff' THEN 'Faculty'
                WHEN reporter_role = 'guard' THEN 'Security Guard'
                WHEN reporter_role = 'admin' THEN 'Admin'
                WHEN reporter_role = 'student' THEN 'Student'
                WHEN reporter_role = 'worker' THEN 'Worker'
                ELSE reporter_role
            END;
        `);
        console.log(`✅ Campus Issues roles reverted: ${issuesUpdate.rowCount} rows`);

        console.log('\nReversion completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Reversion failed:', err);
        process.exit(1);
    }
}

revert();
