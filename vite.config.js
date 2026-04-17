import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Safari 13'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'BrandFlow AI',
        short_name: 'BrandFlow',
        description: 'Automatic Image Branding Tool',
        theme_color: '#0ea5e9',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon.png', sizes: '192x192', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    target: 'es2019',
    minify: 'terser',
    cssTarget: 'safari13',
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
