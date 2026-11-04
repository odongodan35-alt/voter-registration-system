import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'hero-voting.png'],
      manifest: false, // we ship our own manifest.webmanifest
      workbox: {
        // Cache app shell (HTML/CSS/JS) but NOT API responses
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico,webmanifest}'],
        navigateFallback: '/offline.html',
        navigateFallbackAllowlist: [/^\/(?!api).*/],
        // Do not cache API calls — data must always be live
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:5000\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      },
      devOptions: {
        enabled: false // enable PWA only in production build
      }
    })
  ],
  server: { port: 5173 }
});