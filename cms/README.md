# Southside Construction CMS

This Strapi app is the backend dashboard for editable Southside Construction website content.

It is intentionally separate from the Astro static site at the repo root. The existing website design and the Cloudflare Pages contact form in `functions/contact.js` are not part of this CMS phase.

## Local Setup

```bash
cp cms/.env.example cms/.env
npm run dev
```

The root `npm run dev` command starts both development servers:

- Astro website: `http://localhost:4321`
- Strapi CMS admin: `http://localhost:1337/admin`

Create the first Strapi admin user in the browser. If you only need one side, use `npm run dev:site` for Astro or `npm run cms:develop` for Strapi.

## Editable Content

The CMS contains these version-controlled content types:

- `Home Page`: hero title, description, hero image, and the What we build intro copy.
- `What We Build Card`: service card title, description, bullet points, image, image alt text, and order.
- `Gallery Category`: category title, slug, thumbnail image, thumbnail alt text, and order.
- `Gallery Photo`: image, caption, alt text, category, and order.
- `Contact Page`: contact hero copy/background image and the photo beside the contact form.
- `About Page`: Where and what we build title, text, capability list, and side images.

Use Draft & Publish for page content and collections. For launch, publish the records that Astro should read.

## Media Uploads

Media uploads use Cloudflare R2 through Strapi's official `@strapi/provider-upload-aws-s3` provider. The Strapi user only uploads through the Media Library; Strapi writes the original file and generated responsive formats to R2 and stores the returned media URLs in the Strapi database.

Set `R2_UPLOAD_ENABLED=true` or provide R2 credentials. If R2 is enabled but required credentials are missing, Strapi fails startup instead of silently falling back to local uploads.

```env
R2_UPLOAD_ENABLED=true
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=southside-construction-strapi-media
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://assets.example.com
```

## Initial Content Seed

With Strapi running, create an API token with permissions to upload files and create/update the CMS content types. Then run:

```bash
STRAPI_API_TOKEN=... npm run cms:seed:current -- --yes
```

The seed script uploads the existing images from `public/images`, creates the current home/contact/about content, creates the four What we build cards, creates one default gallery category, and creates gallery photo records for the current gallery images.

The script is not idempotent for collection entries. If you run it twice, it will create duplicate service/gallery records. Review and publish seeded drafts in the Strapi admin before wiring Astro to the API.

To migrate only the old local images into the Strapi Media Library and R2, without creating page/gallery content, run:

```bash
STRAPI_URL=https://your-cms-url.example STRAPI_API_TOKEN=... npm run cms:media:migrate -- --dry-run
STRAPI_URL=https://your-cms-url.example STRAPI_API_TOKEN=... npm run cms:media:migrate -- --yes
```

The migration uses Strapi's Upload API. This is important: uploading directly to R2 would copy the objects, but Strapi's media browser would not see them because no upload records would exist in the Strapi database.

## Later Astro Integration

Astro should remain static and fetch CMS data during `astro build` using:

```env
STRAPI_URL=https://your-cms-url.example
STRAPI_API_TOKEN=...
```

For production content updates, set `CLOUDFLARE_PAGES_DEPLOY_HOOK_URL` in `cms/.env.production`. Strapi will POST that deploy hook after relevant content or media changes, with a short debounce to avoid rebuild bursts. The hook URL must be kept secret.

Expected REST reads:

- `/api/home-page?populate=*`
- `/api/what-we-build-cards?populate=*&sort=order:asc&status=published`
- `/api/gallery-categories?populate=*&sort=order:asc&status=published`
- `/api/gallery-photos?populate=*&sort=order:asc&status=published`
- `/api/contact-page?populate=*`
- `/api/about-page?populate=*`

Strapi does not populate media, components, or relations by default, so Astro should always request the fields it needs with `populate`.

## Production Notes

The root `compose.yaml` runs Strapi in Docker and stores SQLite data on a named Docker volume at `/srv/app/data/data.db`. Back up the SQLite database with:

```bash
npm run cms:backup
```

For the complete Cloudflare Pages, R2, webhook, VPS, and backup checklist, see `docs/deployment.md`.
