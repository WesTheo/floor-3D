import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // keep module as-is so our env patch runs before pipeline()
    exclude: ['@xenova/transformers'],
  },
  server: {
    // DO NOT enable COOP/COEP yet; keep defaults to avoid isolation issues
  },
});
