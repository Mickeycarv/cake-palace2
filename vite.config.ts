import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    // The SSR build only exists to pre-render HTML; it doesn't need /public copied.
    copyPublicDir: !isSsrBuild,
  },
}));
