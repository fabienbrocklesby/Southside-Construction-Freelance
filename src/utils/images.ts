export type CFOpts = {
  width?: number;
  quality?: number; // 1-100
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  format?: 'auto' | 'avif' | 'webp' | 'json' | 'jpeg' | 'png';
  dpr?: 'auto' | number;
};

function buildParams(opts: CFOpts = {}) {
  const params: string[] = [];
  const { width, quality = 75, fit = 'cover', format = 'auto', dpr = 'auto' } = opts;
  if (width) params.push(`width=${width}`);
  if (quality) params.push(`quality=${quality}`);
  if (fit) params.push(`fit=${fit}`);
  if (format) params.push(`format=${format}`);
  if (dpr) params.push(`dpr=${dpr}`);
  return params.join(',');
}

function stripLeadingSlash(p: string) {
  return p && p[0] === '/' ? p.slice(1) : p;
}

export function cfImage(path: string, opts: CFOpts = {}) {
  // Hotfix: always return raw path so images work without CDN or JS.
  const p = stripLeadingSlash(path);
  return `/${p}`;
}

export function cfSrcSet(path: string, widths: number[], opts: Omit<CFOpts, 'width'> = {}) {
  // Hotfix: no srcset to keep things simple and robust across environments.
  return '';
}
