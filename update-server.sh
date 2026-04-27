#!/bin/bash
# AI小说生成器 - 服务器端更新脚本
# 用于更新已部署的服务器上的模型名称和代码

set -e

echo "🚀 开始更新服务器..."

# 配置项目路径（根据实际情况修改）
PROJECT_DIR=${PROJECT_DIR:-/opt/ai-novel-generator}
BACKEND_DIR="$PROJECT_DIR/backend"

echo "📁 项目目录: $PROJECT_DIR"

# 1. 进入项目目录
cd "$PROJECT_DIR" || exit 1

# 2. 拉取最新代码（如果是 git 仓库）
if [ -d .git ]; then
    echo "📥 拉取最新代码..."
    git pull origin main || git pull origin master || true
fi

# 3. 更新后端 .env 文件中的模型名称
if [ -f "$BACKEND_DIR/.env" ]; then
    echo "🔧 更新后端 .env 模型名称..."
    sed -i 's/AI_MODEL=deepseek-chat/AI_MODEL=deepseek-v4-flash/g' "$BACKEND_DIR/.env"
    sed -i 's/AI_MODEL=deepseek-reasoner/AI_MODEL=deepseek-v4-pro/g' "$BACKEND_DIR/.env"
    echo "✅ .env 已更新"
    
    # 显示更新后的配置
    echo "📋 当前 AI 配置:"
    grep "AI_" "$BACKEND_DIR/.env" || true
else
    echo "⚠️  未找到 $BACKEND_DIR/.env，请手动检查环境变量"
fi

# 4. 更新依赖
echo "📦 更新后端依赖..."
cd "$BACKEND_DIR"
npm install

# 5. 重启服务（如果使用 PM2）
if command -v pm2 &> /dev/null; then
    echo "🔄 重启后端服务..."
    pm2 restart novel-backend || pm2 restart all || true
    pm2 save
    echo "✅ 服务已重启"
else
    echo "⚠️  未找到 PM2，请手动重启后端服务"
fi

# 6. 构建前端
echo "🏗️  构建前端..."
cd "$PROJECT_DIR/frontend"
npm install
npm run build

# 7. 验证 Nginx（如果使用）
if command -v nginx &> /dev/null; then
    echo "🌐 检查 Nginx 配置..."
    nginx -t && systemctl reload nginx || true
fi

echo ""
echo "✅ 更新完成！"
echo ""
echo "📌 重要提醒："
echo "   - DeepSeek 旧模型名称 deepseek-chat / deepseek-reasoner 将于 2026-07-24 废弃"
echo "   - 新模型名称: deepseek-v4-flash (快速模式) / deepseek-v4-pro (推理模式)"
echo ""
echo "🔍 验证命令:"
echo "   curl http://localhost:3000/api/health"
echo "   pm2 logs novel-backend --lines 20"
