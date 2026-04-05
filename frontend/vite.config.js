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
            // 透传自定义 headers
            const userId = req.headers['user-id']
            const guestMode = req.headers['x-guest-mode']
            if (userId) proxyReq.setHeader('user-id', userId)
            if (guestMode) proxyReq.setHeader('x-guest-mode', guestMode)
          })
        }
      }
    },
    // 添加响应头，放宽 CSP 限制（仅开发环境）
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:;"
    }
  }
})
