import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(__dirname, '..');
const siteRoot = path.resolve(cmsRoot, '..');
const imageRoot = path.join(siteRoot, 'public', 'images');

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

const galleryImages = [
  'Image1.jpg',
  'IMG_0045.jpg',
  'IMG_0051.jpg',
  'IMG_0323.jpg',
  'IMG_0415.jpg',
  'IMG_0557.jpg',
  'IMG_0558.jpg',
  'IMG_0559.jpg',
  'IMG_0609.jpg',
  'IMG_0611.jpg',
  'IMG_0716.jpg',
  'IMG_0832.jpg',
  'IMG_0861.jpg',
  'IMG_0871.jpg',
  'IMG_0872.jpg',
  'IMG_0873.jpg',
  'IMG_0874.jpg',
  'IMG_0875.jpg',
  'IMG_0876.jpg',
  'IMG_0919.jpg',
  'IMG_0920.jpg',
  'IMG_0946.jpg',
  'IMG_0947.jpg',
  'IMG_1061.jpg',
  'IMG_1063.jpg',
  'IMG_1064.jpg',
  'IMG_1074.jpg',
  'IMG_1075.jpg',
  'IMG_1103.jpg',
  'IMG_1104.jpg',
  'IMG_1105.jpg',
  'IMG_1200.jpg',
  'IMG_1202.jpg',
  'IMG_1203.jpg',
  'IMG_1204.jpg',
  'IMG_2538.jpg',
  'IMG_2541.jpg',
  'IMG_2611.jpg',
  'IMG_2612.jpg',
  'IMG_2614.jpg',
  'IMG_2615.jpg',
  'IMG_4306.jpg',
  'IMG_4307.jpg',
  'IMG_4902.jpg',
  'IMG_5019.jpg',
  'IMG_5022.jpg',
  'IMG_5660.jpg',
  'IMG_6336.jpg',
  'IMG_6337.jpg',
  'IMG_6383.jpg',
  'IMG_6384.jpg',
  'IMG_6385.jpg',
  'IMG_6389.jpg',
  'IMG_7832.jpg',
  'IMG_7833.jpg',
  'IMG_8013.jpg',
  'IMG_8598.jpg',
  'IMG_9427.jpg',
  'IMG_9428.jpg',
  'IMG_9432.jpg',
  'IMG_9442.jpg',
  'IMG_9484.jpg',
  'IMG_9485.jpg',
  'IMG_9520.jpg',
  'IMG_9521.jpg',
  'IMG_9535.jpg',
];

const serviceCards = [
  {
    title: 'New house building',
    description:
      'Architecturally-led or design-and-build, we manage details from foundations to finishes - warm, efficient, and fit for Nelson Tasman conditions.',
    bulletPoints: [
      { text: 'Design coordination and council consent' },
      { text: 'Energy-efficient framing and insulation' },
      { text: 'High-quality interior fit-out' },
    ],
    imageFile: 'IMG_1105.jpg',
    imageAltText: 'New house build exterior',
    order: 10,
  },
  {
    title: 'Sheds',
    description:
      'Workshops, farm sheds, and storage buildings built tough - sized to your needs with durable cladding and secure access systems.',
    bulletPoints: [
      { text: 'Concrete pads and drainage' },
      { text: 'Roller doors, windows, ventilation' },
      { text: 'Rural and residential sites' },
    ],
    imageFile: 'IMG_9520.jpg',
    imageAltText: 'Custom shed build',
    order: 20,
  },
  {
    title: 'Renovations',
    description:
      'Transform kitchens, bathrooms, and living spaces. We improve flow, light, and performance without disrupting your daily life.',
    bulletPoints: [
      { text: 'Structural alterations and relevels' },
      { text: 'Warm, dry, and weathertight upgrades' },
      { text: 'Seamless extensions and re-clads' },
    ],
    imageFile: 'IMG_1075.jpg',
    imageAltText: 'Renovated interior space',
    order: 30,
  },
  {
    title: 'Decks & fencing',
    description:
      'Extend your living outdoors with durable decking and privacy fencing - perfect for summer in Tasman.',
    bulletPoints: [
      { text: 'Hardwood, pine, and composite options' },
      { text: 'Stairs, handrails, and screens' },
      { text: 'Engineered substructures' },
    ],
    imageFile: 'IMG_7832.jpg',
    imageAltText: 'Timber deck and fencing',
    order: 40,
  },
];

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

async function uploadImage(filename) {
  const filePath = path.join(imageRoot, filename);
  const bytes = await readFile(filePath);
  const form = new FormData();
  const blob = new Blob([bytes], { type: 'image/jpeg' });

  form.append('files', blob, filename);

  const uploaded = await strapiRequest('/api/upload', {
    method: 'POST',
    body: form,
  });

  return uploaded[0].id;
}

async function uploadImages(filenames) {
  const ids = new Map();

  for (const filename of filenames) {
    if (ids.has(filename)) continue;
    process.stdout.write(`Uploading ${filename}... `);
    ids.set(filename, await uploadImage(filename));
    process.stdout.write('done\n');
  }

  return ids;
}

async function upsertSingle(route, data) {
  const response = await strapiRequest(route, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  return response.data;
}

async function createCollectionEntry(route, data) {
  const response = await strapiRequest(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });

  return response.data;
}

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error('This script creates CMS records and uploads media. Re-run with --yes when ready.');
    console.error('Example: STRAPI_API_TOKEN=... npm run cms:seed:current -- --yes');
    process.exit(1);
  }

  if (!STRAPI_API_TOKEN) {
    console.error('Missing STRAPI_API_TOKEN. Create a Strapi API token with create/update/upload permissions first.');
    process.exit(1);
  }

  const requiredImages = new Set([
    'IMG_0609.jpg',
    'IMG_0611.jpg',
    'IMG_5660.jpg',
    'IMG_7833.jpg',
    'IMG_9432.jpg',
    ...serviceCards.map((card) => card.imageFile),
    ...galleryImages,
  ]);

  const media = await uploadImages([...requiredImages]);

  await upsertSingle('/api/home-page', {
    heroTitle: 'Building excellence across Nelson Tasman',
    heroDescription:
      'New house builds, sheds, renovations, decks and fencing, crafted with precision, delivered with care, and built to last in our local climate.',
    heroImage: media.get('IMG_0609.jpg'),
    servicesIntroTitle: 'What we build',
    servicesIntroText:
      'From dream homes to durable sheds and outdoor living, we deliver thoughtful builds that suit your site, budget, and lifestyle. Need something not listed? We take on custom projects after a quick chat to scope it properly.',
  });

  await upsertSingle('/api/contact-page', {
    heroTitle: "Let's talk about your project",
    heroDescription:
      "New build, renovation, shed, or outdoor - tell us what you're planning and we'll get back with next steps.",
    heroBackgroundImage: media.get('IMG_0611.jpg'),
    heroBackgroundAltText: 'Outdoor deck area',
    formSidePhoto: media.get('IMG_5660.jpg'),
    formSidePhotoAltText: 'Site and tools',
  });

  await upsertSingle('/api/about-page', {
    whereWeBuildTitle: 'Where and what we build',
    whereWeBuildMainText:
      'We cover Nelson, Tasman, Richmond, Motueka, Mapua, and nearby communities. From new house builds to sheds, renovations, and outdoor living - we tailor the approach to your site and lifestyle.',
    capabilityItems: [
      { text: 'New homes' },
      { text: 'Sheds & workshops' },
      { text: 'Renovations' },
      { text: 'Extensions' },
      { text: 'Decks & fencing' },
      { text: 'Re-clads' },
    ],
    sideImages: [
      { image: media.get('IMG_7833.jpg'), altText: 'Deck and railing detail' },
      { image: media.get('IMG_5660.jpg'), altText: 'Shed exterior with durable cladding' },
      { image: media.get('IMG_9432.jpg'), altText: 'Renovated interior' },
    ],
  });

  for (const card of serviceCards) {
    await createCollectionEntry('/api/what-we-build-cards', {
      title: card.title,
      description: card.description,
      bulletPoints: card.bulletPoints,
      image: media.get(card.imageFile),
      imageAltText: card.imageAltText,
      order: card.order,
    });
  }

  const galleryCategory = await createCollectionEntry('/api/gallery-categories', {
    title: 'Project Gallery',
    slug: 'project-gallery',
    thumbnailImage: media.get('IMG_0611.jpg'),
    thumbnailAltText: 'Southside Construction project gallery',
    order: 10,
  });
  const galleryCategoryId = galleryCategory.documentId || galleryCategory.id;

  for (const [index, filename] of galleryImages.entries()) {
    await createCollectionEntry('/api/gallery-photos', {
      image: media.get(filename),
      caption: '',
      altText: 'Southside Construction project photo',
      category: galleryCategoryId,
      order: index + 1,
    });
  }

  console.log('Seed complete. Review and publish drafts in the Strapi admin before wiring Astro to the API.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
