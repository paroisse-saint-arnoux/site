// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeFigures from './src/lib/rehype-figures.mjs';

export default defineConfig({
  site: 'https://saint-arnoux.fr',
  trailingSlash: 'ignore',
  markdown: {
    processor: unified({ rehypePlugins: [rehypeFigures] }),
  },
});
