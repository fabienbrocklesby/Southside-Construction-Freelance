import type { Core } from '@strapi/strapi';

function toCspSource(value: string) {
  if (!value) return '';

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return value;
  }
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const mediaSources = [
    "'self'",
    'data:',
    'blob:',
    'market-assets.strapi.io',
    toCspSource(env('R2_PUBLIC_URL', '')),
    toCspSource(env('R2_ENDPOINT', '')),
  ].filter(Boolean);

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': mediaSources,
            'media-src': mediaSources,
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    'strapi::cors',
    'strapi::poweredBy',
    'strapi::query',
    {
      name: 'strapi::body',
      config: {
        formLimit: env('UPLOAD_FORM_LIMIT', '32mb'),
        jsonLimit: env('UPLOAD_JSON_LIMIT', '32mb'),
        textLimit: env('UPLOAD_TEXT_LIMIT', '32mb'),
        formidable: {
          maxFileSize: env.int('UPLOAD_SIZE_LIMIT_BYTES', 25 * 1024 * 1024),
        },
      },
    },
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
