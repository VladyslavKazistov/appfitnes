import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Картинки упражнений не грузим заранее, а кешируем при первом просмотре.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/ex/'),
            handler: 'CacheFirst',
            options: { cacheName: 'exercise-images', expiration: { maxEntries: 400 } },
          },
        ],
      },
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'FitPlan — мой план тренировок',
        short_name: 'FitPlan',
        description: 'Персональный план тренировок на массу',
        lang: 'ru',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0b0f14',
        theme_color: '#0b0f14',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
