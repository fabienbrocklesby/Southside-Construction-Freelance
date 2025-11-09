import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('public/images');
const OUT_DIR = path.resolve('public/.optimized-fullsize');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function isSupportedImage(file) {
  return /\.(png|jpe?g|webp)$/i.test(file);
}

async function optimiseImage(file) {
  const inPath = path.join(SRC_DIR, file);
  const base = file.replace(/\.[^.]+$/, '');
  const outPath = path.join(OUT_DIR, `${base}.jpg`);

  const pipeline = sharp(inPath).rotate();
  await pipeline
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(outPath);
}

async function main() {
  await ensureDir(OUT_DIR);
  const files = await fs.promises.readdir(SRC_DIR);
  const images = files.filter(isSupportedImage);

  console.log(`Optimising ${images.length} images...`);

  for (const file of images) {
    try {
      await optimiseImage(file);
      process.stdout.write('.');
    } catch (err) {
      console.error(`\nFailed to optimise ${file}:`, err);
    }
  }

  console.log('\nOptimisation complete.');

  const backupDir = path.resolve('public/.images-backup');
  const hasBackup = fs.existsSync(backupDir);
  if (!hasBackup) {
    await fs.promises.mkdir(backupDir, { recursive: true });
  }

  // Move originals into backup directory
  for (const file of images) {
    const from = path.join(SRC_DIR, file);
    const to = path.join(backupDir, file);
    await fs.promises.rename(from, to);
  }

  // Move optimised files into images directory
  const optimisedFiles = await fs.promises.readdir(OUT_DIR);
  for (const file of optimisedFiles) {
    const from = path.join(OUT_DIR, file);
    const to = path.join(SRC_DIR, file);
    await fs.promises.rename(from, to);
  }

  // Cleanup temporary directory
  await fs.promises.rm(OUT_DIR, { recursive: true, force: true });

  console.log('Backup stored in public/.images-backup.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
