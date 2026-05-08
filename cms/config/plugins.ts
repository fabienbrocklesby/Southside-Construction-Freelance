import type { Core } from '@strapi/strapi';

const R2_ACCOUNT_ID = '9f08cc5b560a2570e12982550b39f6ac';
const R2_BUCKET = 'southside-construction-strapi-media';
const R2_PUBLIC_DEV_URL = 'https://pub-8fffd787049d49baa5ea1904061fcd51.r2.dev';

function readEnv(env: Core.Config.Shared.ConfigParams['env'], keys: string[], fallback = '') {
  for (const key of keys) {
    const value = env(key);
    if (value) return value;
  }

  return fallback;
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => {
  const accessKeyId = readEnv(env, ['R2_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID']);
  const secretAccessKey = readEnv(env, [
    'R2_SECRET_ACCESS_KEY',
    'R2_ACCESS_SECRET',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_ACCESS_SECRET',
  ]);
  const bucket = env('R2_BUCKET', R2_BUCKET);
  const endpoint = env('R2_ENDPOINT', `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  const shouldUseR2 = env.bool('R2_UPLOAD_ENABLED', Boolean(accessKeyId || secretAccessKey));

  if (!shouldUseR2) {
    return {};
  }

  const missing = [
    !accessKeyId ? 'R2_ACCESS_KEY_ID' : '',
    !secretAccessKey ? 'R2_SECRET_ACCESS_KEY' : '',
    !bucket ? 'R2_BUCKET' : '',
    !endpoint ? 'R2_ENDPOINT' : '',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `R2 uploads are enabled, but missing required env var(s): ${missing.join(', ')}.`,
    );
  }

  const publicUrl = env('R2_PUBLIC_URL', R2_PUBLIC_DEV_URL).replace(/\/+$/, '');
  const rootPath = env('R2_ROOT_PATH', '').replace(/^\/+|\/+$/g, '');

  console.info(`Strapi upload provider: Cloudflare R2 bucket "${bucket}" via ${endpoint}`);

  return {
    upload: {
      config: {
        provider: 'aws-s3',
        providerOptions: {
          ...(publicUrl ? { baseUrl: publicUrl } : {}),
          ...(rootPath ? { rootPath } : {}),
          s3Options: {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            endpoint,
            region: 'auto',
            params: {
              Bucket: bucket,
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
