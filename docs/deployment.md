# Southside Construction Deployment

This repo is structured for:

- Frontend: static Astro HTML/CSS/JS deployed to Cloudflare Pages from `dist/`.
- Contact form: Cloudflare Pages Function in `functions/contact.js`.
- CMS: Strapi in a Docker container on the VPS.
- Media: Strapi Media Library uploads stored in Cloudflare R2, not on the VPS.
- Content updates: Strapi webhook triggers a Cloudflare Pages Deploy Hook so the static frontend rebuilds after content/media changes.

## Local Development

```bash
npm install
npm run dev
```

The dev script first stops old processes on ports `4321`, `1337`, and `8788`, then starts Astro and Strapi.

Useful commands:

```bash
npm run dev:stop
npm run dev:site
npm run cms:develop
npm run pages:dev
npm run build
npm run cms:build
```

`npm run pages:dev` builds the static site and runs it through Wrangler Pages locally on `http://localhost:8788`, including the Pages Function runtime.

## Cloudflare Pages

Cloudflare's Astro guide uses:

- Build command: `npm run build`
- Build output directory: `dist`

This repo also includes `wrangler.jsonc` with `pages_build_output_dir: "./dist"` and a current compatibility date for Pages Functions.

First-time setup, after logging in:

```bash
npm run cf:login
npm run cf:pages:create
```

Deploy from local build output:

```bash
npm run pages:deploy
```

For Git-connected production deploys, set these Cloudflare Pages build environment variables:

```env
STRAPI_URL=https://cms.example.com
STRAPI_API_TOKEN=...
CMS_FETCH_TIMEOUT_MS=10000
```

Set Pages Function secrets with Wrangler or in the Cloudflare dashboard:

```bash
wrangler pages secret put ZEPTO_API_KEY
wrangler pages secret put FROM_EMAIL
wrangler pages secret put SOUTHSIDE_EMAIL
```

## R2 Media Bucket

The R2 bucket for this repo has already been created on the `cloudflare@fabienbrocklesby.com` account.

Bucket name:

```text
southside-construction-strapi-media
```

Create R2 S3 API credentials in Cloudflare with object read/write access to this bucket. Strapi uses those credentials through the official AWS S3 upload provider with:

```env
R2_UPLOAD_ENABLED=true
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=southside-construction-strapi-media
R2_ENDPOINT=https://9f08cc5b560a2570e12982550b39f6ac.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-8fffd787049d49baa5ea1904061fcd51.r2.dev
```

The bucket's `r2.dev` public URL is enabled so local Strapi uploads render immediately. For final production polish, replace `R2_PUBLIC_URL` with a custom R2 public domain such as `assets.southsideconstruction.nz` after DNS is ready. Cloudflare's R2 public bucket docs recommend a custom domain for production caching and access controls; `r2.dev` is best for development and pre-launch.

## Strapi on the VPS

Create the production env file:

```bash
cp cms/.env.production.example cms/.env.production
```

Fill in real Strapi secrets and R2 credentials. Then build and run:

```bash
docker compose up -d --build
```

The compose file mounts named volumes:

- `strapi-data` -> `/srv/app/data` for SQLite.
- `strapi-backups` -> `/srv/app/backups` for backup output.

There is intentionally no persistent `/srv/app/public/uploads` volume. Media should go to R2; if R2 is misconfigured, Strapi should fail startup rather than quietly storing uploads on the server.

Production SQLite path:

```env
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=/srv/app/data/data.db
```

This keeps the database outside the container filesystem, so rebuilding or replacing the container does not remove CMS data.

## Backups

Run a live SQLite backup before upgrades and on a VPS cron:

```bash
docker compose exec strapi npm run db:backup
```

Copy backups off the VPS regularly. A good minimum is nightly backup plus manual backup before Strapi upgrades, schema changes, or Docker image replacement.

## Strapi to Pages Rebuilds

Cloudflare Pages Deploy Hooks are the standard fit for a static frontend backed by a headless CMS. Create a Pages Deploy Hook in Cloudflare:

1. Open Workers & Pages.
2. Select the new Southside Pages project.
3. Go to Settings > Builds > Deploy Hooks.
4. Create a hook for the production branch.
5. Copy the hook URL and keep it secret.

Then set the hook URL on the production Strapi server:

```bash
CLOUDFLARE_PAGES_DEPLOY_HOOK_URL=<paste the copied Cloudflare Deploy Hook URL>
PAGES_REBUILD_DEBOUNCE_MS=10000
```

Restart the Strapi container after changing `cms/.env.production`.

This repo also has a code-level Strapi lifecycle subscriber that POSTs the hook after relevant home/about/contact/gallery/media changes. The debounce prevents one media upload or content save from queueing a burst of rebuilds.

Alternatively, in Strapi production you can use Strapi's built-in webhook UI:

1. Open Settings > Webhooks.
2. Add a webhook named `Cloudflare Pages rebuild`.
3. Paste the Cloudflare Deploy Hook URL.
4. Enable entry create/update/delete/publish/unpublish and media create/update/delete events.

Every relevant Strapi content or media change should POST to Cloudflare, which starts a new Pages build. Astro fetches the Strapi content during `npm run build`, then emits static HTML into `dist/`.

## Migrating Existing Images into Strapi/R2

Use Strapi's Upload API so each file is both uploaded to R2 and registered in Strapi's upload database tables:

```bash
STRAPI_URL=https://strapi.southsideconstruction.co.nz STRAPI_API_TOKEN=... npm run cms:media:migrate -- --dry-run
STRAPI_URL=https://strapi.southsideconstruction.co.nz STRAPI_API_TOKEN=... npm run cms:media:migrate -- --yes
```

The script scans `public/images` by default, skips files already present in Strapi by filename, and uploads missing files. Do not copy files directly into R2 for this migration unless you also create matching Strapi upload records; otherwise the Strapi media selector will not list them.

## References

- Cloudflare Pages Astro guide: `https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/`
- Cloudflare Pages Wrangler configuration: `https://developers.cloudflare.com/pages/functions/wrangler-configuration/`
- Cloudflare Pages Deploy Hooks, including Strapi: `https://developers.cloudflare.com/pages/configuration/deploy-hooks/`
- Cloudflare R2 public buckets: `https://developers.cloudflare.com/r2/buckets/public-buckets/`
- Cloudflare R2 Wrangler commands: `https://developers.cloudflare.com/r2/reference/wrangler-commands/`
- Strapi Amazon S3 provider with Cloudflare R2 support: `https://docs.strapi.io/cms/configurations/media-library-providers/amazon-s3`
- Strapi database configuration: `https://docs.strapi.io/cms/configurations/database`
