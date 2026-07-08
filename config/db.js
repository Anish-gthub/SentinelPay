const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) return console.error('❌ Error acquiring client:', err.stack);
    console.log('✅ Connected to Neon Cloud PostgreSQL via Connection Pool');
    release();
});

module.exports = pool;