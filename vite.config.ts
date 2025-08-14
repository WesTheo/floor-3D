import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/segment': {
        target: 'https://api-inference.huggingface.co/models/nvidia/segformer-b0-finetuned-ade-512-512',
        changeOrigin: true,
        rewrite: (_path) => '',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // HF token will be set via environment variable HF_TOKEN
            const token = process.env.HF_TOKEN;
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
            proxyReq.setHeader('Content-Type', 'application/octet-stream');
          });
        }
      },
      '/api/depth': {
        target: 'https://api-inference.huggingface.co/models/Intel/dpt-hybrid-midas',
        changeOrigin: true,
        rewrite: (_path) => '',
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // HF token will be set via environment variable HF_TOKEN
            const token = process.env.HF_TOKEN;
            if (token) {
              proxyReq.setHeader('Authorization', `Bearer ${token}`);
            }
            proxyReq.setHeader('Content-Type', 'application/octet-stream');
          });
        }
      }
    }
  },
});
