# Southside Construction Website

This repository contains the source for the Southside Construction static website built with [Astro](https://astro.build/), Tailwind CSS and DaisyUI. The site includes pages for home, about, gallery and contact, a Cloudflare Pages function to handle contact form submissions, and a Strapi CMS in `cms/`.

## Development

```bash
npm install
npm run dev
```

`npm run dev` stops any old processes on ports `4321` and `1337`, then starts:

- Astro website: `http://localhost:4321`
- Strapi CMS admin: `http://localhost:1337/admin`

Use `npm run dev:stop` to shut down local dev ports manually.

## Build

```bash
npm run build
```

The frontend remains a static Astro build. Deploy the generated `dist/` folder to Cloudflare Pages with:

```bash
npm run pages:deploy
```

See `docs/deployment.md` for the Cloudflare Pages, R2, Strapi webhook, Docker, and backup setup.
