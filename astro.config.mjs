// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// SITE_URL / BASE_PATH are set by the GitHub Pages workflow; defaults work locally.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://mirkozlatunic.github.io',
  base: process.env.BASE_PATH ?? '/',
  vite: { plugins: [tailwindcss()] },
});
