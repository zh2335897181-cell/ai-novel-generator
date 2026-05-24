import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const userId = req.headers['user-id']
            const guestMode = req.headers['x-guest-mode']
            if (userId) proxyReq.setHeader('user-id', userId)
            if (guestMode) proxyReq.setHeader('x-guest-mode', guestMode)
          })
        }
      }
    },
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:;"
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/element-plus')) return 'element-plus'
          if (id.includes('node_modules/echarts')) return 'vendor-charts'
          if (id.includes('node_modules/docx') || id.includes('node_modules/jspdf') || id.includes('node_modules/file-saver')) return 'vendor-docs'
        }
      }
    }
  }
})

