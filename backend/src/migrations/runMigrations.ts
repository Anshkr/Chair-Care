import fs from 'fs';
import path from 'path';
import pool, { query } from '../config/database';

export const runMigrations = async (): Promise<void> => {
  console.log('🔄 [Migrations]: Initializing migration check on PostgreSQL / Neon...');

  // Create migrations table if not exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Find migrations directory across both dev (ts-node) and compiled (dist) paths
  const possibleDirs = [
    path.join(__dirname),
    path.join(__dirname, '../../src/migrations'),
    path.join(process.cwd(), 'src/migrations'),
    path.join(process.cwd(), 'backend/src/migrations'),
  ];

  let migrationsDir = '';
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      const sqls = fs.readdirSync(dir).filter((f) => f.endsWith('.sql'));
      if (sqls.length > 0) {
        migrationsDir = dir;
        break;
      }
    }
  }

  if (!migrationsDir) {
    throw new Error('Migrations directory containing SQL files could not be located.');
  }

  console.log(`📁 [Migrations]: Using migration files from: ${migrationsDir}`);

  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of sqlFiles) {
    const existing = await query('SELECT id FROM _migrations WHERE name = $1', [file]);
    if (existing.rows.length === 0) {
      console.log(`📦 [Migrations]: Applying migration ${file}...`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ [Migrations]: Applied ${file} successfully.`);
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`❌ [Migrations]: Failed to apply ${file}:`, err.message);
        throw err;
      } finally {
        client.release();
      }
    } else {
      console.log(`⏭️ [Migrations]: Skipping ${file} (already applied).`);
    }
  }

  console.log('✨ [Migrations]: All migrations are up to date.');
};

// If run directly from CLI
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🚀 Migrations finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration runner failed:', err);
      process.exit(1);
    });
}
