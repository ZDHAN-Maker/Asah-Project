const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'openmusic',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  ssl: false,
});

// Tes koneksi otomatis
pool.connect()
  .then(() => console.log('PostgreSQL connected successfully!'))
  .catch((err) => console.error('Failed to connect to PostgreSQL:', err));

module.exports = pool;
