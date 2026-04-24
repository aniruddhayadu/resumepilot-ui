import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/oauth2': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/resume': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/exports': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/export': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      // 👇 YAHAN AI SERVICE KA NAYA PROXY ADD KIYA HAI 👇
      '/ai': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
})