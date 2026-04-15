require('dotenv').config();
const db = require('./config/db');

async function run() {
    try {
        const storedName = 'education-hub-master.png';
        const mapUrl = `/uploads/blueprints/${storedName}`;
        
        await db.query('DELETE FROM campus_blueprints WHERE stored_name = $1;', [storedName]);
        await db.query(`
            INSERT INTO campus_blueprints 
            (original_name, stored_name, file_type, file_size, uploaded_by, map_url) 
            VALUES ($1, $2, $3, $4, $5, $6);
        `, ['Education Hub Master Layout', storedName, 'image/png', 452993, 'Admin', mapUrl]);
        
        console.log("✅ Blueprint DB entry created successfully!");
    } catch (e) {
        console.error("❌ DB Error:", e);
    } finally {
        process.exit();
    }
}
run();
