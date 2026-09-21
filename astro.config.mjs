import { defineConfig } from 'astro/config';
import vite from './vite.config.ts';
export default defineConfig({
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  build: { format: 'directory', assets: 'assets' },
  vite,
});
