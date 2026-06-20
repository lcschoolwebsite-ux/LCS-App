import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.ico', 'logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'LC School Management',
        short_name: 'LCSMS',
        description: 'School Management System',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js'
    })
  ],
  server: {
    port: 3000,
    historyApiFallback: true,
  },
})
