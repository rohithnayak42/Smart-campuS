require('dotenv').config();
const db = require('../config/db');

async function migrate() {
    console.log('--- Database Role Standardization Migration ---');
    try {
        // 1. Unify roles to lowercase and consolidate names
        const usersUpdate = await db.query(`
            UPDATE users SET role = CASE 
                WHEN role ILIKE 'Faculty%' OR role ILIKE 'Staff' THEN 'staff'
                WHEN role ILIKE 'Security Guard' OR role ILIKE 'Guard' THEN 'guard'
                ELSE LOWER(role)
            END;
        `);
        console.log(`✅ Users table roles updated: ${usersUpdate.rowCount} rows`);

        // 2. Update campus_issues
        const issuesUpdate = await db.query(`
            UPDATE campus_issues SET reporter_role = CASE 
                WHEN reporter_role ILIKE 'Faculty%' OR reporter_role ILIKE 'Staff' THEN 'staff'
                WHEN reporter_role ILIKE 'Security Guard' OR reporter_role ILIKE 'Guard' THEN 'guard'
                ELSE LOWER(reporter_role)
            END;
        `);
        console.log(`✅ Campus Issues reporter roles updated: ${issuesUpdate.rowCount} rows`);

        // 3. Update stakeholder_tasks
        const tasksUpdate = await db.query(`
            UPDATE stakeholder_tasks SET assignee_role = CASE 
                WHEN assignee_role ILIKE 'Faculty%' OR assignee_role ILIKE 'Staff' THEN 'staff'
                WHEN assignee_role ILIKE 'Security Guard' OR assignee_role ILIKE 'Guard' THEN 'guard'
                ELSE LOWER(assignee_role)
            END;
        `);
        console.log(`✅ Stakeholder Tasks assignee roles updated: ${tasksUpdate.rowCount} rows`);

        console.log('\nMigration path completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
