import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, '..');
const siteRoot = path.resolve(cmsRoot, '..');

async function loadRootEnv() {
  const envPath = path.join(siteRoot, '.env');

  try {
    const contents = await readFile(envPath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;

      process.env[key] = rawValue
        .trim()
        .replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

await loadRootEnv();

const DEFAULT_IMAGE_DIR = path.join(siteRoot, 'public', 'images');
const STRAPI_URL = (process.env.STRAPI_URL || process.env.LIVE_SITE_STRAPI_URL || 'http://localhost:1337')
  .trim()
  .replace(/\/+$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.LIVE_SITE_STRAPI_API_TOKEN;
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
    else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function authHeaders(extra = {}) {
  return {
    ...(STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {}),
    ...extra,
  };
}

async function strapiRequest(route, options = {}) {
  const response = await fetch(`${STRAPI_URL}${route}`, {
    ...options,
    headers: authHeaders(options.headers || {}),
  });

  const body = await response.text();
  const json = body ? JSON.parse(body) : {};

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${route} failed: ${response.status} ${body}`);
  }

  return json;
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
      filename: entry,
      filePath,
      mimeType: MIME_TYPES[ext] || 'application/octet-stream',
      size: fileStat.size,
    });
  }

  return files;
}

function normalizeUploadResponse(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

async function findExistingUpload(filename) {
  const params = new URLSearchParams({
    'filters[name][$eq]': filename,
    'pagination[pageSize]': '1',
  });

  const uploads = normalizeUploadResponse(await strapiRequest(`/api/upload/files?${params}`));
  return uploads.find((upload) => upload?.name === filename) || null;
}

async function uploadImage(file) {
  const bytes = await readFile(file.filePath);
  const form = new FormData();
  const blob = new Blob([bytes], { type: file.mimeType });

  form.append('files', blob, file.filename);

  const uploaded = normalizeUploadResponse(
    await strapiRequest('/api/upload', {
      method: 'POST',
      body: form,
    }),
  );

  return uploaded[0];
}

async function main() {
  const options = parseArgs();

  if (!options.yes && !options.dryRun) {
    console.error('This script uploads local image files into Strapi/R2.');
    console.error('Re-run with --dry-run to preview or --yes to upload.');
    console.error('Example: STRAPI_URL=https://strapi.example.com STRAPI_API_TOKEN=... npm run cms:media:migrate -- --yes');
    process.exit(1);
  }

  if (!STRAPI_API_TOKEN && !options.dryRun) {
    console.error('Missing STRAPI_API_TOKEN. Create a Strapi API token with upload read/create permissions.');
    process.exit(1);
  }

  const images = await listImages(options.dir);
  let uploadedCount = 0;
  let skippedCount = 0;

  console.log(`Found ${images.length} image(s) in ${options.dir}`);
  if (!STRAPI_API_TOKEN) {
    console.log('No STRAPI_API_TOKEN set; dry run will list files without checking existing Strapi uploads.');
  }

  for (const image of images) {
    const existing = options.force || !STRAPI_API_TOKEN ? null : await findExistingUpload(image.filename);

    if (existing) {
      skippedCount += 1;
      console.log(`skip ${image.filename} already exists as upload id ${existing.id}`);
      continue;
    }

    if (options.dryRun) {
      console.log(`would upload ${image.filename} (${image.size} bytes)`);
      continue;
    }

    const uploaded = await uploadImage(image);
    uploadedCount += 1;
    console.log(`uploaded ${image.filename} as upload id ${uploaded?.id ?? 'unknown'}`);
  }

  console.log(`Done. Uploaded ${uploadedCount}; skipped ${skippedCount}; dryRun=${options.dryRun}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
