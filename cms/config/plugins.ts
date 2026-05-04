import type { Core } from '@strapi/strapi';

const R2_ACCOUNT_ID = '9f08cc5b560a2570e12982550b39f6ac';
const R2_BUCKET = 'southside-construction-strapi-media';
const R2_PUBLIC_DEV_URL = 'https://pub-8fffd787049d49baa5ea1904061fcd51.r2.dev';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  if (!env.bool('R2_UPLOAD_ENABLED', false)) {
    return {};
  }

  const publicUrl = env('R2_PUBLIC_URL', R2_PUBLIC_DEV_URL).replace(/\/+$/, '');
  const rootPath = env('R2_ROOT_PATH', '').replace(/^\/+|\/+$/g, '');

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          ...(publicUrl ? { baseUrl: publicUrl } : {}),
          ...(rootPath ? { rootPath } : {}),
          s3Options: {
            credentials: {
              accessKeyId: env('R2_ACCESS_KEY_ID'),
              secretAccessKey: env('R2_ACCESS_SECRET'),
            },
            endpoint: env('R2_ENDPOINT', `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`),
            region: 'auto',
            params: {
              Bucket: env('R2_BUCKET', R2_BUCKET),
            },
          },
          providerConfig: {
            preventOverwrite: true,
          },
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
        sizeLimit: env.int('UPLOAD_SIZE_LIMIT_BYTES', 25 * 1024 * 1024),
        breakpoints: {
          xlarge: 1600,
          large: 1000,
          medium: 750,
          small: 500,
          xsmall: 96,
        },
        security: {
          allowedTypes: ['image/*'],
          deniedTypes: ['image/svg+xml'],
        },
      },
    },
  };
};

export default config;
