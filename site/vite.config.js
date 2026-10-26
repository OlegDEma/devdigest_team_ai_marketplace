import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base: the site is served from /<repo>/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
});
