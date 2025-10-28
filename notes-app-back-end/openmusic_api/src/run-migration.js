const fs = require('fs');
const path = require('path');
const pool = require('./app/db/index');

const migrationsDir = path.join(__dirname, '../migrations');

// Fungsi untuk membuat file migrasi baru untuk pembuatan tabel
const createMigration = (migrationName) => {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
  const migrationFileName = `${timestamp}_${migrationName}.sql`;
  const migrationFilePath = path.join(migrationsDir, migrationFileName);

  // Menyusun SQL untuk pembuatan tabel berdasarkan nama migrasi
  const migrationContent = `
-- Migration: ${migrationName}
  `;

  // Menulis file migrasi baru
  fs.writeFileSync(migrationFilePath, migrationContent.trim(), 'utf8');
  console.log(`Created migration file: ${migrationFileName}`);
};

// Fungsi utama untuk menjalankan migrasi
(async () => {
  try {
    const args = process.argv.slice(2);
    if (args[0] === 'create' && args[1]) {
      const migrationName = args[1];
      createMigration(migrationName);
      process.exit(0);
    }

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
