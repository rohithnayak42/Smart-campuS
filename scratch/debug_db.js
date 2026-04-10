require('dotenv').config();
const db = require('../config/db');

async function debug() {
    try {
        console.log("--- Checking Database Connection ---");
        const res = await db.query('SELECT NOW()');
        console.log("Connection successful:", res.rows[0]);

        console.log("\n--- Checking Users Table Schema ---");
        const schema = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.table(schema.rows);

        console.log("\n--- Checking Current Users ---");
        const users = await db.query('SELECT id, name, email, role, real_email FROM users');
        console.table(users.rows);

    } catch (err) {
        console.error("DEBUG ERROR:", err);
    } finally {
        process.exit();
    }
}

debug();
