# Docker 部署指南

## 📦 概述

使用 Docker 部署 AI 小说生成系统，包含：
- **MySQL 8.0** - 数据库
- **Node.js 后端** - API 服务
- **Nginx 前端** - 静态文件服务

## 🚀 快速开始（3步部署）

### 1. 进入 Docker 目录

```bash
cd docker
```

### 2. 配置环境变量

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑 .env 文件，设置你的 AI API Key
nano .env
```

`.env` 文件内容：
```env
# 数据库密码（建议修改）
DB_PASSWORD=your_secure_password

# AI API 配置（必填）
AI_API_KEY=sk-your-api-key-here
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 等待 30 秒让服务初始化
docker-compose logs -f
```

✅ **部署完成！**
- 前端访问：http://localhost
- 后端 API：http://localhost:8080

---

## 🔧 常用命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f           # 所有服务
docker-compose logs -f backend   # 仅后端
docker-compose logs -f mysql    # 仅数据库

# 停止服务
docker-compose stop

# 完全删除容器和数据（谨慎使用）
docker-compose down -v

# 重新构建（代码更新后）
docker-compose up -d --build

# 进入容器调试
docker exec -it ai-novel-backend sh
docker exec -it ai-novel-mysql mysql -u root -p
```

---

## 📁 目录结构

```
ai-novel-generator/
├── backend/
│   ├── Dockerfile          # 后端容器配置
│   └── ...
├── frontend/
│   ├── Dockerfile          # 前端容器配置
│   ├── nginx.conf          # Nginx 配置
│   └── ...
├── docker/
│   ├── docker-compose.yml  # 编排配置
│   ├── .env.example        # 环境变量示例
│   └── .env                # 你的配置（不提交到git）
└── database/
    └── schema.sql          # 数据库结构
```

---

## 🌐 服务器部署（有公网IP）

### 1. 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登录使权限生效
exit
# 重新 SSH 连接
```

### 2. 上传项目

```bash
# 方式1：使用 git
git clone https://github.com/yourusername/ai-novel-generator.git
cd ai-novel-generator

# 方式2：使用 scp（本地执行）
scp -r ai-novel-generator root@你的服务器IP:/opt/
ssh root@你的服务器IP
cd /opt/ai-novel-generator
```

### 3. 配置并启动

```bash
cd docker

# 配置环境变量
cp .env.example .env
nano .env  # 填写你的 AI API Key

# 启动
docker-compose up -d
```

### 4. 配置域名（可选）

如果有域名，编辑 `frontend/nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 你的域名
    ...
}
```

然后重新构建：
```bash
docker-compose up -d --build frontend
```

---

## 🔒 HTTPS 配置（SSL 证书）

### 方式1：使用 Nginx Proxy Manager（推荐）

```yaml
# 在 docker-compose.yml 中添加
  npm:
    image: jc21/nginx-proxy-manager:latest
    ports:
      - "80:80"
      - "443:443"
      - "81:81"  # 管理界面
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
```

访问 `http://服务器IP:81` 管理 SSL 证书。

### 方式2：手动配置证书

```bash
# 使用 Let's Encrypt
docker run -it --rm \
  -v ai-novel_certs:/etc/letsencrypt \
  certbot/certbot certonly \
  --standalone -d your-domain.com
```

---

## 🐳 单机多服务部署

如果你想在一台服务器上部署多个实例：

```bash
# 创建多个 docker-compose 文件
docker-compose -f docker-compose.yml -p novel1 up -d
docker-compose -f docker-compose.yml -p novel2 up -d
```

或者修改端口映射：

```yaml
# docker-compose.override.yml
services:
  frontend:
    ports:
      - "3001:80"  # 改为3001端口
  backend:
    ports:
      - "8081:8080"  # 改为8081端口
  mysql:
    ports:
      - "3307:3306"  # 改为3307端口
```

---

## 🔄 更新部署

当代码有更新时：

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像
docker image prune -f
```

---

## 💾 数据备份

```bash
# 备份数据库
docker exec ai-novel-mysql mysqldump -u root -p ai_novel_db > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i ai-novel-mysql mysql -u root -p ai_novel_db < backup_20240101.sql

# 自动备份脚本（添加到 crontab）
0 2 * * * cd /opt/ai-novel-generator/docker && docker exec ai-novel-mysql mysqldump -u root -p'密码' ai_novel_db > /backup/novel_$(date +\%Y\%m\%d).sql
```

---

## 🛠️ 故障排查

### 1. 容器启动失败

```bash
# 查看错误日志
docker-compose logs backend

# 检查环境变量
cat .env

# 重置并重新启动
docker-compose down -v
docker-compose up -d
```

### 2. 数据库连接失败

```bash
# 检查 MySQL 状态
docker-compose ps mysql

# 进入 MySQL 容器
docker exec -it ai-novel-mysql mysql -u root -p

# 检查网络连接
docker network ls
docker network inspect docker_ai-novel-network
```

### 3. AI 生成失败

```bash
# 检查后端日志
docker-compose logs -f backend

# 检查 API Key
docker exec ai-novel-backend env | grep AI
```

### 4. 前端无法访问

```bash
# 检查 Nginx 配置
docker exec ai-novel-frontend nginx -t

# 查看 Nginx 日志
docker-compose logs frontend
```

---

## 📝 自定义配置

### 修改数据库密码

1. 停止服务：`docker-compose down`
2. 删除旧数据卷：`docker volume rm docker_mysql_data`
3. 修改 `.env` 中的 `DB_PASSWORD`
4. 重新启动：`docker-compose up -d`

### 使用外部数据库

编辑 `docker-compose.yml`，删除 mysql 服务，修改后端环境变量：

```yaml
  backend:
    environment:
      DB_HOST: your-external-mysql.com
      DB_USER: your_user
      DB_PASSWORD: your_password
```

### 配置代理

如果服务器需要代理访问外网：

```yaml
  backend:
    environment:
      HTTP_PROXY: http://proxy.example.com:8080
      HTTPS_PROXY: http://proxy.example.com:8080
```

---

## 🎯 生产环境优化

### 1. 使用 .dockerignore

在 `backend/` 和 `frontend/` 创建 `.dockerignore`：

```
node_modules
npm-debug.log
.git
.env
.DS_Store
```

### 2. 资源限制

```yaml
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 3. 日志管理

```yaml
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## ❓ 常见问题

**Q: Docker 部署和直接部署有什么区别？**
A: Docker 更易于迁移、扩展和管理，适合生产环境。

**Q: 需要备案吗？**
A: 如果使用国内服务器和域名，需要备案。使用国外服务器不需要。

**Q: 如何更新 AI API Key？**
A: 修改 `.env` 文件，然后执行 `docker-compose up -d` 即可。

**Q: 数据会丢失吗？**
A: MySQL 数据存储在 Docker 卷中，删除容器不会丢失。但建议定期备份。

---

## 📚 参考链接

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [MySQL Docker 镜像](https://hub.docker.com/_/mysql)
- [Nginx Docker 镜像](https://hub.docker.com/_/nginx)
