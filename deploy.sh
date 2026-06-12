#!/bin/bash
# 前端生产环境部署脚本
# 用法: sudo bash deploy.sh

set -e

FRONTEND_DIR="/data/ai_fontend/recruitment_ai_frontend"
NGINX_CONTAINER="ai_fontend"

cd "$FRONTEND_DIR"

# 1. 拉取最新代码
echo ">>> git pull..."
git pull

# 2. 构建前端
echo ">>> npm ci && npm run build..."
docker run --rm \
  -v "${FRONTEND_DIR}:/app" \
  -w /app \
  node:20-alpine \
  sh -c "npm ci && npm run build"

# 3. 重建 nginx 容器（端口 5173 → 443 HTTPS）
echo ">>> 停止旧容器..."
docker stop "$NGINX_CONTAINER" 2>/dev/null || true
docker rm "$NGINX_CONTAINER" 2>/dev/null || true

echo ">>> 启动新容器（HTTP）..."
docker run -d --name "$NGINX_CONTAINER" \
  -p 5173:80 \
  -v "${FRONTEND_DIR}/dist:/usr/share/nginx/html:ro" \
  -v "${FRONTEND_DIR}/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v /etc/nginx/ssl:/etc/nginx/ssl:ro \
  nginx:alpine

echo ">>> 部署完成！"
