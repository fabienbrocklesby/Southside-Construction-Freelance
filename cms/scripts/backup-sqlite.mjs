import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const defaultDatabase = process.env.NODE_ENV === 'production' ? '/srv/app/data/data.db' : '.tmp/data.db';
const databasePath = process.env.DATABASE_FILENAME || defaultDatabase;
const outputDir = process.env.BACKUP_DIR || 'backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(outputDir, `strapi-${timestamp}.db`);

if (!fs.existsSync(databasePath)) {
  console.error(`SQLite database not found at ${databasePath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const database = new Database(databasePath, { readonly: true });
await database.backup(outputPath);
database.close();

console.log(`SQLite backup written to ${outputPath}`);
