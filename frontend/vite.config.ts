import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.svg', 'robots.txt'],
      manifest: {
        name: 'Not From Here — Invasive Species Sentinel',
        short_name: 'Not From Here',
        description: 'Rapid field screening and detection sentinel for invasive species in Southern Ontario.',
        theme_color: '#080b10',
        background_color: '#080b10',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '32x32 64x64 128x128 256x256',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
