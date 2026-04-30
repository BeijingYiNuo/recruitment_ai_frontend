# AI 招聘系统 - 前端部署文档


---

## 1. 环境准备

在开始之前，请确保你的环境中已安装以下工具：

- **Node.js**: 推荐版本 `>= 18.0.0` (当前环境: `v24.14.0`)
- **npm**: 随 Node.js 一同安装
- **或 pnpm**: 推荐使用 pnpm 以获得更快的依赖安装速度

---

## 2. 本地开发与动态配置

本项目支持通过命令行动态指定后端 API 地址。

### 2.1 安装依赖
```bash
npm install
```

### 2.2 启动开发服务
如果你想使用默认的后端地址（配置在 `.env` 或 `vite.config.js` 中）：
```bash
npm run dev
```

### 2.3 动态指定后端 IP (推荐)
如果后端 IP 发生变动，你可以在启动时直接传入 `VITE_API_URL` 变量：
```bash
# 使用 npx cross-env (已作为开发依赖安装)
npx cross-env VITE_API_URL=http://192.168.0.83:8002 npm run dev
```
运行后，终端会打印出当前生效的后端地址：`>>> [Vite Config] 当前后端接口地址: http://1.2.3.4:8001`

---

## 3. 生产环境构建

构建会将 Vue 源代码编译为纯静态的 HTML/JS/CSS 文件，存放在 `dist` 目录中。

### 3.1 标准构建
```bash
npm run build
```

### 3.2 动态指定后端地址构建
如果你希望打包后的镜像/代码指向特定的内网 IP：
```bash
npx cross-env VITE_API_URL=http://192.168.0.83:8002 npm run build
```




---

## 4. 常见问题 (FAQ)

### Q1: 页面刷新出现 404？
**A**: 这是单页应用（SPA）的正常现象。请确保 Nginx 配置中包含 `try_files $uri $uri/ /index.html;`。

### Q2: 跨域问题 (CORS)？
**A**: 
- **开发环境**：已通过 `vite.config.js` 的 `proxy` 解决。
- **生产环境**：由 Nginx 配置中的 `proxy_pass` 解决，前端发出的请求只需使用相对路径 `/api`。

### Q3: 运行时如何修改 IP？
**A**: 前端是静态的，构建后 IP 已注入代码中。如果 IP 经常变，建议前端使用相对于域名的路径 `/api`，并始终通过 Nginx 转发到正确的后端 IP。
