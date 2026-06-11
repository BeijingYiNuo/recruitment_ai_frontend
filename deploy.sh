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

# 3. 重启 nginx
echo ">>> docker restart ${NGINX_CONTAINER}..."
docker restart "$NGINX_CONTAINER"

echo ">>> 部署完成!"
