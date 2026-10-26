import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectRepo, writeCatalog } from '../scripts/build-catalog.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));

// Dev only: regenerate catalog.json when plugins or the marketplace manifest
// change, then reload the page. Production builds run the script once in CI.
function catalogWatch(root) {
  return {
    name: 'catalog-watch',
    configureServer(server) {
      const out = resolve(here, 'public');
      const watched = [resolve(root, 'plugins'), resolve(root, '.claude-plugin', 'marketplace.json')];
      let timer;
      const rebuild = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            const c = writeCatalog({ root, out, repo: detectRepo(root) });
            server.config.logger.info(`catalog rebuilt: ${c.plugins.length} plugin(s), ${c.artifacts.length} artifact(s)`);
          } catch (e) {
            server.config.logger.error(`catalog build failed: ${e.message}`);
          }
          server.ws.send({ type: 'full-reload' });
        }, 300);
      };
      server.watcher.add(watched);
      server.watcher.on('all', (_event, file) => {
        if (watched.some((w) => file === w || file.startsWith(`${w}/`))) rebuild();
      });
    },
  };
}

// Relative base: the site is served from /<repo>/ on GitHub Pages.
// `--mode fixtures` points the dev server at site/fixtures instead of this repository.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), catalogWatch(mode === 'fixtures' ? resolve(here, 'fixtures') : resolve(here, '..'))],
  build: { outDir: 'dist', emptyOutDir: true },
}));
