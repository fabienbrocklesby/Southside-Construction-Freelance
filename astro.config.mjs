import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
  vite: {
    server: {
      watch: {
        ignored: ['**/cms/**'],
      },
    },
  },
});
