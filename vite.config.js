import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte(),
    // Installable app that works offline: after the first visit the whole app
    // is saved on the phone, and it updates itself the next time it's online.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered in src/main.js, which also checks for updates
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Possession Clock',
        short_name: 'Possession',
        description: 'Possession stopwatches for two teams',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111418',
        theme_color: '#111418',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // A new version takes over right away instead of waiting for every
        // copy of the app to be closed (phones rarely fully close it).
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Drill videos are big, so they aren't part of the app download.
        // The Drills screen saves them into this cache; the worker plays them
        // from there (with the partial "range" requests iPhones use for video).
        globIgnores: ['drills/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/drills/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'drill-videos',
              rangeRequests: true,
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      }
    })
  ]
});
