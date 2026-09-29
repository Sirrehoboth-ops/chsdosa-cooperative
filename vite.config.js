import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/chsdosa-cooperative/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },

      manifest: {
        name: 'CHSDOSA Cooperative Society',
        short_name: 'CHSDOSA',
        description: 'CHSDOSA Cooperative Society Member App',
        theme_color: '#0B1F3A',
        background_color: '#F8F9FA',
        display: 'standalone',
        start_url: '/chsdosa-cooperative/',
        scope: '/chsdosa-cooperative/',

        icons: [
          {
            src: '/chsdosa-cooperative/chsdosa-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/chsdosa-cooperative/chsdosa-icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})