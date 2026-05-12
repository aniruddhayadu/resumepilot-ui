import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const proxyTarget = process.env.VITE_PROXY_TARGET || process.env.PROXY_TARGET || 'http://localhost:8080'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/templates/images': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/resume': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/exports': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/export': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/job-matches': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
