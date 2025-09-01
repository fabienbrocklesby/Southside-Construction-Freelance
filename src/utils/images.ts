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
  const p = stripLeadingSlash(path);
  const params = buildParams(opts);
  // In local dev, Cloudflare's /cdn-cgi/image endpoint isn't available.
  // Fall back to the original asset path so images render during `astro dev`.
  if (import.meta.env.DEV) {
    return `/${p}`;
  }
  return `/cdn-cgi/image/${params}/${p}`;
}

export function cfSrcSet(path: string, widths: number[], opts: Omit<CFOpts, 'width'> = {}) {
  // In dev, return an empty srcset so the browser uses `src` directly.
  if (import.meta.env.DEV) {
    return '';
  }
  return widths
    .map((w) => `${cfImage(path, { ...opts, width: w })} ${w}w`)
    .join(', ');
}
