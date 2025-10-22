const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'openmusic',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  ssl:
    process.env.PGSSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('connect', () => {
  console.log('PostgreSQL connected successfully!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on PostgreSQL client:', err);
  process.exit(-1);
});

module.exports = pool;
