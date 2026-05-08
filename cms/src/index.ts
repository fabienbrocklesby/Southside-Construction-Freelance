import type { Core } from '@strapi/strapi';

const REBUILD_MODELS = [
  'api::home-page.home-page',
  'api::about-page.about-page',
  'api::contact-page.contact-page',
  'api::what-we-build-card.what-we-build-card',
  'api::gallery-category.gallery-category',
  'api::gallery-photo.gallery-photo',
  'plugin::upload.file',
];

function readDeployHookUrl() {
  return (
    process.env.CLOUDFLARE_PAGES_DEPLOY_HOOK_URL ||
    process.env.CF_PAGES_DEPLOY_HOOK_URL ||
    process.env.PAGES_DEPLOY_HOOK_URL ||
    ''
  ).trim();
}

function readRebuildDebounceMs() {
  const parsed = Number.parseInt(process.env.PAGES_REBUILD_DEBOUNCE_MS || '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 10000;
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const deployHookUrl = readDeployHookUrl();

    if (!deployHookUrl) {
      strapi.log.info('Cloudflare Pages rebuild hook is not configured.');
      return;
    }

    const debounceMs = readRebuildDebounceMs();
    let pendingRebuild: ReturnType<typeof setTimeout> | null = null;

    const queueRebuild = (eventName: string, uid: string) => {
      if (pendingRebuild) return;

      pendingRebuild = setTimeout(async () => {
        pendingRebuild = null;

        try {
          const response = await fetch(deployHookUrl, { method: 'POST' });
          if (!response.ok) {
            strapi.log.warn(
              `Cloudflare Pages rebuild hook failed after ${eventName} on ${uid}: HTTP ${response.status}`,
            );
            return;
          }

          strapi.log.info(`Cloudflare Pages rebuild queued after ${eventName} on ${uid}.`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          strapi.log.warn(`Cloudflare Pages rebuild hook failed: ${message}`);
        }
      }, debounceMs);
    };

    (strapi.db.lifecycles as any).subscribe({
      models: REBUILD_MODELS,
      afterCreate(event: any) {
        queueRebuild('create', event.model.uid);
      },
      afterCreateMany(event: any) {
        queueRebuild('createMany', event.model.uid);
      },
      afterUpdate(event: any) {
        queueRebuild('update', event.model.uid);
      },
      afterUpdateMany(event: any) {
        queueRebuild('updateMany', event.model.uid);
      },
      afterDelete(event: any) {
        queueRebuild('delete', event.model.uid);
      },
      afterDeleteMany(event: any) {
        queueRebuild('deleteMany', event.model.uid);
      },
    });

    strapi.log.info(
      `Cloudflare Pages rebuild hook configured for ${REBUILD_MODELS.length} Strapi model(s).`,
    );
  },
};
