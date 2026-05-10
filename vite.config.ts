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
      '/auth': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/oauth2': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api/templates': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api/payments': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api/admin': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api/jobmatch': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/templates/images': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/resume': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/exports': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/export': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/ai': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/job-matches': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
