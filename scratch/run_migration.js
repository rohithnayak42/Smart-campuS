require('dotenv').config();
const { createUserTable } = require('../models/User');

async function migrate() {
    try {
        console.log('--- Starting Migration ---');
        await createUserTable();
        console.log('--- Migration Completed ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
