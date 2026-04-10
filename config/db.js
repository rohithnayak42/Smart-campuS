const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
       ? { rejectUnauthorized: false } 
       : false,
});

if (!process.env.DATABASE_URL) {
  console.error('❌ CRITICAL: DATABASE_URL environment variable is missing.');
} else {
  console.log('✅ DATABASE_URL detected.');
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
