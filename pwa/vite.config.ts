import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['placeholder.svg', 'icon.svg', 'flags/*.png'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'HappyBites Menu',
        short_name: 'Menu',
        description: 'QR food menu for restaurants',
        theme_color: '#f2750a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    outDir: '../public/pwa',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/wp-json': {
        target: 'http://localhost',
        changeOrigin: true,
      },
    },
  },
});
