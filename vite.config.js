import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据 mode 加载 .env.[mode] 文件中的变量
  const env = loadEnv(mode, process.cwd());

  // 这里的逻辑：优先级为 命令行变量 > .env 文件变量 > 默认值
  const targetPort = parseInt(env.VITE_PORT) || 5173;
  const targetApi = process.env.VITE_API_URL || env.VITE_API_URL || 'http://192.168.0.83:8001';
  
  console.log(`\n>>> [Vite Config] 当前后端接口地址: ${targetApi}\n`);

  return {
    plugins: [
      vue(),
      basicSsl(),
    ],
    server: {
      // 端口跟随模式走
      port: targetPort,
      // 注意：这里没有写 host: '0.0.0.0'，完全交给你命令行控制
      proxy: {
        '/api': {
          target: targetApi,
          changeOrigin: true,
          ws: true,
          autoRewrite: true,
        },
      },
    },
  }
})