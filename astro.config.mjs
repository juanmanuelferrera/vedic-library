import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vedic-library.pages.dev',
  integrations: [mdx(), sitemap()],
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
