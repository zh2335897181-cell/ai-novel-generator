#!/bin/bash

# AI小说生成系统 - Linux/Mac Docker 一键部署脚本
# 用法: ./docker-deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    AI小说生成系统 - Docker 一键部署脚本${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}[警告] 建议以 root 用户或使用 sudo 运行${NC}"
    echo ""
fi

# 检查 Docker 安装
echo -e "${BLUE}[1/5]${NC} 检查 Docker 安装..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[错误] Docker 未安装！${NC}"
    echo ""
    echo "安装命令："
    echo "  Ubuntu/Debian: curl -fsSL https://get.docker.com | sh"
    echo "  CentOS/RHEL:   sudo yum install docker"
    echo "  Mac:           brew install docker"
    echo ""
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker 已安装"
echo ""

# 检查 Docker Compose
echo -e "${BLUE}[2/5]${NC} 检查 Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}[错误] Docker Compose 未安装！${NC}"
    echo "安装命令: sudo apt install docker-compose-plugin"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Docker Compose 可用 (${COMPOSE_CMD})"
echo ""

# 进入 docker 目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "${SCRIPT_DIR}/docker/docker-compose.yml" ]; then
    cd "${SCRIPT_DIR}/docker"
elif [ -f "${SCRIPT_DIR}/docker-compose.yml" ]; then
    cd "${SCRIPT_DIR}"
else
    echo -e "${RED}[错误] 未找到 docker-compose.yml 文件${NC}"
    echo "请确保在项目的 docker 目录中运行此脚本"
    exit 1
fi

# 配置环境变量
echo -e "${BLUE}[3/5]${NC} 检查环境变量配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "创建 .env 配置文件..."
        cp .env.example .env
    else
        echo -e "${RED}[错误] 未找到 .env.example 文件${NC}"
        exit 1
    fi
fi

# 检查 AI_API_KEY 是否已配置
if ! grep -q "^AI_API_KEY=sk-" .env 2>/dev/null; then
    echo ""
    echo -e "${YELLOW}================================================${NC}"
    echo -e "${YELLOW}    需要配置 AI API Key${NC}"
    echo -e "${YELLOW}================================================${NC}"
    echo ""
    echo "请编辑 .env 文件，配置你的 AI API Key"
    echo ""
    
    # 尝试使用不同的编辑器
    if command -v nano &> /dev/null; then
        echo "使用 nano 编辑器..."
        nano .env
    elif command -v vim &> /dev/null; then
        echo "使用 vim 编辑器..."
        vim .env
    elif command -v vi &> /dev/null; then
        echo "使用 vi 编辑器..."
        vi .env
    else
        echo "请手动编辑 .env 文件，添加 AI_API_KEY"
        echo "当前路径: $(pwd)/.env"
        echo ""
        read -p "按回车键退出..."
        exit 1
    fi
    
    # 再次检查
    if ! grep -q "^AI_API_KEY=sk-" .env 2>/dev/null; then
        echo -e "${RED}配置未完成，请重新运行脚本${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}[OK]${NC} 环境变量已配置"
echo ""

# 拉取镜像并启动
echo -e "${BLUE}[4/5]${NC} 构建并启动服务..."
echo "这可能需要几分钟时间，请耐心等待..."
echo ""

$COMPOSE_CMD down 2>/dev/null || true
$COMPOSE_CMD up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[错误] 部署失败！${NC}"
    echo "请检查以上错误信息"
    exit 1
fi

echo ""
echo -e "${GREEN}[OK]${NC} 服务启动成功！"
echo ""

# 等待服务初始化
echo -e "${BLUE}[5/5]${NC} 等待服务初始化..."
sleep 10

# 检查服务状态
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    部署状态检查${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
$COMPOSE_CMD ps

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    部署完成！${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "访问地址："
echo -e "  - 前端界面：${BLUE}http://localhost${NC}"
echo -e "  - 后端 API：${BLUE}http://localhost:8080${NC}"
echo ""
echo "常用命令："
echo "  - 查看日志：  $COMPOSE_CMD logs -f"
echo "  - 停止服务：  $COMPOSE_CMD stop"
echo "  - 重启服务：  $COMPOSE_CMD restart"
echo "  - 更新部署：  $COMPOSE_CMD up -d --build"
echo ""
echo -e "${GREEN}================================================${NC}"
echo ""
