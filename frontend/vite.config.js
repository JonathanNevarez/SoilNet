import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SoilNet - Monitoreo Agrícola',
        short_name: 'SoilNet',
        description: 'Plataforma IoT para monitoreo de cultivos y suelo.',
        theme_color: '#16a34a', 
        background_color: '#F6F9F7', 
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: 'SoilNet.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'SoilNet.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'SoilNet.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
