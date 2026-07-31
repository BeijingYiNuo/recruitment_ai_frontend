import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 根据 mode 加载 .env.[mode] 文件中的变量
  const env = loadEnv(mode, process.cwd());

  // 这里的逻辑：优先级为 命令行变量 > .env 文件变量 > 默认值
  const targetPort = parseInt(env.VITE_PORT) || 5173;
  const targetApi = process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:8001';
  // 报告生成服务地址（/doc2md/stream 和 /generate）
  const targetReportApi = process.env.VITE_REPORT_API_URL || env.VITE_REPORT_API_URL || 'http://152.136.119.117:8000';

  console.log(`\n>>> [Vite Config] 当前后端接口地址: ${targetApi}`);
  console.log(`>>> [Vite Config] 报告生成服务地址: ${targetReportApi}\n`);

  return {
    plugins: [
      vue(),
    ],
    server: {
      // 端口跟随模式走
      port: targetPort,
      // 注意：这里没有写 host: '0.0.0.0'，完全交给你命令行控制
      proxy: {
        // 报告生成相关接口 → 独立后端服务（路径去掉 /api 前缀）
        '/api/doc2md': {
          target: targetReportApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/api/generate': {
          target: targetReportApi,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        // 其余 /api 请求 → 主后端
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