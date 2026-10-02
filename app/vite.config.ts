import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '^/[a-zA-Z0-9_-]{3,20}$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        bypass(req) {
          const url = req.url || '';
          if (
            url.startsWith('/analytics') ||
            url.startsWith('/src') ||
            url.startsWith('/@') ||
            url.startsWith('/node_modules') ||
            url.startsWith('/favicon')
          ) {
            return url;
          }
          return null;
        },
      },
    },
  },
})

