import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('public/images');
const OUT_DIR = path.resolve('public/thumbs');
const WIDTHS = [160, 240, 320, 480, 640, 720, 960];

async function ensureDir(p){ await fs.promises.mkdir(p, { recursive: true }); }

function isImage(f){ return /\.(png|jpg|jpeg)$/i.test(f); }

async function processOne(file){
  const inPath = path.join(IMAGES_DIR, file);
  const extMatch = file.match(/\.(png|jpg|jpeg)$/i);
  const ext = (extMatch ? extMatch[0].slice(1) : 'jpg').toLowerCase();
  const base = path.basename(file, '.' + ext);
  for (const w of WIDTHS){
  const outDir = path.join(OUT_DIR, String(w));
    await ensureDir(outDir);
  const outPath = path.join(outDir, `${base}.${ext}`);
    const img = sharp(inPath).rotate();
    await img.resize({ width: w, withoutEnlargement: true }).toFile(outPath);
  }
}

async function main(){
  await ensureDir(OUT_DIR);
  const files = await fs.promises.readdir(IMAGES_DIR);
  const imgs = files.filter(isImage);
  console.log(`Generating thumbs for ${imgs.length} images...`);
  for (const f of imgs){
    await processOne(f);
  }
  console.log('Done.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
