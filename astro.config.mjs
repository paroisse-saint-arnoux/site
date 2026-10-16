// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://saint-arnoux.fr',
  trailingSlash: 'ignore',
  integrations: [
    // sitemap-index.xml + sitemap-0.xml, sans les pages de confirmation des formulaires
    sitemap({ filter: (page) => !/\/(merci|confirmation)\/$/.test(page) }),
  ],
  markdown: {
    processor: unified({ rehypePlugins: [rehypeFigures] }),
  },
});
