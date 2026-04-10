require('dotenv').config();
const db = require('../config/db');

async function migrate() {
    try {
        console.log('--- Starting Role Migration ---');
        
        // 1. Update Faculty/Staff to Staff
        const res1 = await db.query("UPDATE users SET role = 'Staff' WHERE role IN ('Faculty', 'Staff')");
        console.log(`Updated ${res1.rowCount} users to 'Staff'`);

        // 2. Update Security Guard to Guard
        const res2 = await db.query("UPDATE users SET role = 'Guard' WHERE role IN ('Security Guard', 'Guard')");
        console.log(`Updated ${res2.rowCount} users to 'Guard'`);

        // 3. Update reporter_role in campus_issues
        const res3 = await db.query("UPDATE campus_issues SET reporter_role = 'Staff' WHERE reporter_role = 'Faculty'");
        console.log(`Updated ${res3.rowCount} issue reporter roles to 'Staff'`);

        const res4 = await db.query("UPDATE campus_issues SET reporter_role = 'Guard' WHERE reporter_role = 'Security Guard'");
        console.log(`Updated ${res4.rowCount} issue reporter roles to 'Guard'`);

        console.log('--- Migration Finished Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
