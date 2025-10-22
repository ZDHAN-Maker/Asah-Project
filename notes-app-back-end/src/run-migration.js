const fs = require('fs');
const path = require('path');
const pool = require('./app/db/index');

(async () => {
  try {
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found in migrations folder.');
      process.exit(0);
    }

    await files.reduce(async (prevPromise, file) => {
      await prevPromise;
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Running migration: ${file}`);
      await pool.query(sql);
      console.log(`Successfully executed: ${file}\n`);
    }, Promise.resolve());

    console.log('🎉 All migrations executed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
