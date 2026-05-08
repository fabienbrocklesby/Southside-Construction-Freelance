import { createRequire } from 'node:module';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);

const DEFAULT_IMAGE_DIR = '/tmp/southside-images';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function parseArgs() {
  const options = {
    dir: DEFAULT_IMAGE_DIR,
    dryRun: false,
    force: false,
    yes: false,
  };

  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--yes') options.yes = true;
    else if (arg.startsWith('--dir=')) options.dir = path.resolve(arg.slice('--dir='.length));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function listImages(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries.sort((a, b) => a.localeCompare(b))) {
    const filePath = path.join(dir, entry);
    const fileStat = await stat(filePath);
    const ext = path.extname(entry).toLowerCase();

    if (!fileStat.isFile() || !IMAGE_EXTENSIONS.has(ext)) continue;

    files.push({
      filepath: filePath,
      originalFilename: entry,
      mimetype: MIME_TYPES[ext] || 'application/octet-stream',
      size: fileStat.size,
    });
  }

  return files;
}

async function main() {
  const options = parseArgs();

  if (!options.yes && !options.dryRun) {
    console.error('This script imports local images through Strapi internals.');
    console.error('Re-run with --dry-run to preview or --yes to upload.');
    process.exit(1);
  }

  const { createStrapi } = require('@strapi/strapi');
  const appDir = process.cwd();
  const strapi = await createStrapi({
    appDir,
    distDir: path.join(appDir, 'dist'),
  }).load();

  try {
    const uploadService = strapi.plugin('upload').service('upload');
    const images = await listImages(options.dir);
    let uploadedCount = 0;
    let skippedCount = 0;

    console.log(`Found ${images.length} image(s) in ${options.dir}`);

    for (const image of images) {
      const existing = options.force
        ? null
        : await strapi.db.query('plugin::upload.file').findOne({
            where: { name: image.originalFilename },
          });

      if (existing) {
        skippedCount += 1;
        console.log(`skip ${image.originalFilename} already exists as upload id ${existing.id}`);
        continue;
      }

      if (options.dryRun) {
        console.log(`would upload ${image.originalFilename} (${image.size} bytes)`);
        continue;
      }

      const uploaded = await uploadService.upload({
        data: { fileInfo: {} },
        files: image,
      });

      uploadedCount += 1;
      console.log(`uploaded ${image.originalFilename} as upload id ${uploaded?.[0]?.id ?? 'unknown'}`);
    }

    console.log(`Done. Uploaded ${uploadedCount}; skipped ${skippedCount}; dryRun=${options.dryRun}.`);
  } finally {
    await strapi.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
