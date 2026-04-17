import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    basicSsl(),   // 开发环境自签名 HTTPS，使局域网设备可以使用麦克风等安全 API
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.1.37:8001',  // 后端服务地址
        changeOrigin: true,
        ws: true,  // 显式启用 WebSocket 代理
        autoRewrite: true, // 自动重写重定向的 host 头，防止 307 重定向到原始 IP
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
