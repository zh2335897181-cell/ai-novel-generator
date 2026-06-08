# AI 小说工坊 — 阿里云部署全流程

> 适用环境：Ubuntu 22.04 LTS | Node.js 20.x | MySQL 8.0 | Nginx | PM2

---

## 目录

- [一、服务器初始化](#一服务器初始化)
- [二、安装运行环境](#二安装运行环境)
- [三、配置 MySQL 数据库](#三配置-mysql-数据库)
- [四、部署项目代码](#四部署项目代码)
- [五、配置后端环境变量](#五配置后端环境变量)
- [六、启动后端服务（PM2）](#六启动后端服务pm2)
- [七、构建前端](#七构建前端)
- [八、配置 Nginx 反向代理](#八配置-nginx-反向代理)
- [九、配置 HTTPS（SSL 证书）](#九配置-httpsssl-证书)
- [十、配置防火墙](#十配置防火墙)
- [十一、日常更新流程](#十一日常更新流程)
- [十二、常用运维命令](#十二常用运维命令)
- [十三、故障排查](#十三故障排查)

---

## 一、服务器初始化

### 1.1 购买阿里云 ECS

- **推荐配置**：2 核 4G 内存 / 3Mbps 带宽 / 40GB 系统盘
- **操作系统**：Ubuntu 22.04 LTS
- **安全组规则**：开放 22（SSH）、80（HTTP）、443（HTTPS）端口

### 1.2 使用 Workbench 或 SSH 连接

Workbench（推荐）：登录阿里云控制台 → ECS 实例 → 远程连接 → Workbench 远程连接

SSH 连接：
```bash
ssh root@你的服务器公网IP
```

### 1.3 更新系统
```bash
apt update && apt upgrade -y
```

---

## 二、安装运行环境

### 2.1 安装 Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# 验证
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

### 2.2 安装 PM2（进程管理器）
```bash
npm install -g pm2
```

### 2.3 安装 MySQL
```bash
apt install -y mysql-server
```

### 2.4 安装 Nginx
```bash
apt install -y nginx
```

### 2.5 安装 Git
```bash
apt install -y git
```

---

## 三、配置 MySQL 数据库

### 3.1 启动并设置开机自启
```bash
systemctl start mysql
systemctl enable mysql
```

### 3.2 安全配置
```bash
mysql_secure_installation
```
按提示设置 root 密码，建议选择 Y 全部加固选项。

### 3.3 创建数据库和用户
```bash
mysql -u root -p
```

在 MySQL 提示符下执行：
```sql
CREATE DATABASE novel_generator DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'novel_user'@'localhost' IDENTIFIED BY '你的数据库密码';
GRANT ALL PRIVILEGES ON novel_generator.* TO 'novel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3.4 导入表结构
```bash
# 导入基础表
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/schema.sql

# 按顺序导入增量迁移
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_tables.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_features.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_minor_characters.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_writing_style.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_rag_chunk.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_indexes.sql
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/add_admin_columns.sql
```

---

## 四、部署项目代码

### 方式 A：从 GitHub 克隆（推荐）
```bash
cd /opt
git clone https://github.com/你的用户名/ai-novel-generator.git
cd ai-novel-generator
```

> 如果遇到 `fatal: detected dubious ownership` 错误：
> ```bash
> git config --global --add safe.directory /opt/ai-novel-generator
> ```
> 如果拉取时卡住或报 `RPC failed; curl 16 Error in the HTTP2 framing layer`：
> ```bash
> git config --global http.version HTTP/1.1
> git config --global http.postBuffer 524288000
> ```

### 方式 B：本地上传（GitHub 网络不稳定时使用）

在本地打包代码（排除 node_modules、.git、dist 等）：
```bash
# 本地终端（Git Bash）
cd /c/Users/你的路径/ai-novel-generator
tar -czf project.tar.gz --exclude=node_modules --exclude=.git --exclude=frontend/dist frontend/ backend/ database/ package.json DEPLOY.md README.md
```

上传到服务器：
```bash
scp project.tar.gz root@你的服务器IP:/opt/
```

在服务器上解压：
```bash
cd /opt && tar -xzf project.tar.gz -C /opt/ai-novel-generator
```

---

## 五、配置后端环境变量

```bash
cd /opt/ai-novel-generator/backend
```

创建 `.env` 文件：
```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=novel_user
DB_PASSWORD=你的数据库密码
DB_NAME=novel_generator

REDIS_URL=

JWT_SECRET=你的随机字符串（至少32位）
ADMIN_KEY=你的管理员密钥

AI_API_KEY=你的DeepSeek API密钥
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

ALLOWED_ORIGINS=http://ai-novel-generator.xyz
EOF
```

---

## 六、启动后端服务（PM2）

```bash
cd /opt/ai-novel-generator/backend
npm install
pm2 start src/index.js --name novel-backend

# 设置开机自启
pm2 startup
pm2 save

# 验证
pm2 status
pm2 logs novel-backend --lines 20
```

> **注意**：使用 PM2 启动后，关闭 SSH/Workbench 窗口不会影响服务运行。

---

## 七、构建前端

### 方式 A：在服务器上构建
```bash
cd /opt/ai-novel-generator/frontend
npm install
npm run build
# 构建产物在 dist/ 目录
```

### 方式 B：本地构建后上传（推荐，避免服务器内存不足卡顿）

在本地构建：
```bash
cd /c/Users/你的路径/ai-novel-generator/frontend
npm install
npm run build
```

将 `dist` 目录上传到服务器：
```bash
cd /c/Users/你的路径/ai-novel-generator
tar -czf dist.tar.gz -C frontend dist
scp dist.tar.gz root@你的服务器IP:/opt/
```

在服务器解压：
```bash
cd /opt/ai-novel-generator/frontend
tar -xzf /opt/dist.tar.gz
```

---

## 八、配置 Nginx 反向代理

### 8.1 创建 Nginx 配置
```bash
cat > /etc/nginx/sites-available/novel-generator << 'EOF'
server {
    listen 80;
    server_name ai-novel-generator.xyz;  # 改为你的域名

    # 前端静态文件
    location / {
        root /opt/ai-novel-generator/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # SSE 流式响应支持
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
EOF
```

### 8.2 启用配置
```bash
ln -s /etc/nginx/sites-available/novel-generator /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # 删除默认配置

# 测试并重启
nginx -t
systemctl restart nginx
systemctl enable nginx
```

---

## 九、配置 HTTPS（SSL 证书）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书并自动配置 Nginx
certbot --nginx -d ai-novel-generator.xyz

# 测试自动续期
certbot renew --dry-run
```

Let's Encrypt 证书有效期 90 天，Certbot 会自动设置定时任务续期，无需手动维护。

---

## 十、配置防火墙

```bash
# 安装 UFW（已安装则跳过）
apt install -y ufw

# 开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 启用防火墙
ufw enable

# 查看状态
ufw status verbose
```

---

## 十一、日常更新流程

### 11.1 代码更新

**方式 A：Git 拉取**
```bash
cd /opt/ai-novel-generator
git pull

# 更新后端依赖并重启
cd /opt/ai-novel-generator/backend
npm install
pm2 restart novel-backend

# 更新前端依赖并构建
cd /opt/ai-novel-generator/frontend
npm install
npm run build
```

**方式 B：本地上传（GitHub 不稳定时）**
```bash
# 本地打包
cd /c/Users/你的路径/ai-novel-generator
tar -czf project.tar.gz --exclude=node_modules --exclude=.git --exclude=frontend/dist frontend/ backend/ database/ package.json

# 上传
scp project.tar.gz root@你的服务器IP:/opt/

# 服务器解压覆盖并重启
ssh root@你的服务器IP
cp /opt/ai-novel-generator/backend/.env /tmp/.env.backup
cd /opt && tar -xzf project.tar.gz -C /opt/ai-novel-generator
cp /tmp/.env.backup /opt/ai-novel-generator/backend/.env
cd /opt/ai-novel-generator/backend && npm install && pm2 restart novel-backend
```

### 11.2 快速更新前端（只改了前端代码时）

```bash
# 本地构建上传
cd /c/Users/你的路径/ai-novel-generator/frontend
npm run build
tar -czf dist.tar.gz dist
scp dist.tar.gz root@你的服务器IP:/opt/

# 服务器解压
ssh root@你的服务器IP
cd /opt/ai-novel-generator/frontend
tar -xzf /opt/dist.tar.gz
# 刷新页面即可
```

### 11.3 数据库迁移
```bash
# 将新的 SQL 文件上传到服务器后
mysql -u novel_user -p novel_generator < /opt/ai-novel-generator/database/新迁移文件.sql
```

---

## 十二、常用运维命令

```bash
# 查看后端状态
pm2 status

# 查看后端日志
pm2 logs novel-backend

# 查看实时日志
pm2 logs novel-backend --lines 50

# 重启后端
pm2 restart novel-backend

# 停止后端
pm2 stop novel-backend

# 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 重启 Nginx
systemctl restart nginx

# 检查 Nginx 配置
nginx -t

# 查看 MySQL 状态
systemctl status mysql

# 备份数据库
mysqldump -u novel_user -p novel_generator > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u novel_user -p novel_generator < backup_文件.sql

# 查看系统资源
htop         # 如未安装: apt install htop
df -h        # 磁盘使用
free -h      # 内存使用
```

---

## 十三、故障排查

### 13.1 502 Bad Gateway
**原因**：后端服务未启动或挂了
**解决**：
```bash
pm2 status                     # 查看后端进程状态
pm2 logs novel-backend         # 查看错误日志
pm2 restart novel-backend      # 重启
```

### 13.2 504 Gateway Timeout
**原因**：AI 生成请求超时
**解决**：检查 Nginx 配置中的 `proxy_read_timeout` 是否足够大（建议 600s）

### 13.3 前端页面空白
**原因**：Nginx 指向的 `root` 路径没有 `dist/index.html`
**解决**：
```bash
ls /opt/ai-novel-generator/frontend/dist/index.html    # 确认文件存在
nginx -t                                                # 检查 Nginx 配置
systemctl restart nginx
```

### 13.4 数据库连接失败
```bash
systemctl status mysql              # MySQL 是否运行
mysql -u novel_user -p -e "SELECT 1"  # 能否登录
# 检查 .env 中的数据库配置是否正确
```

### 13.5 AI 生成无响应
```bash
# 检查 .env 中的 AI_API_KEY 和 AI_BASE_URL 配置
pm2 logs novel-backend --lines 30    # 查看后端日志中的错误
# 确认 API 密钥余额是否充足
```

### 13.4 更新后页面无变化
**原因**：浏览器缓存
**解决**：按 `Ctrl + F5` 强制刷新，或清除浏览器缓存

### 13.6 常见 Git 错误

**错误：RPC failed / HTTP2 framing layer**
```bash
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
```

**错误：detected dubious ownership**
```bash
git config --global --add safe.directory /opt/ai-novel-generator
```

**错误：cannot open .git/FETCH_HEAD: Permission denied**
```bash
sudo chown -R $(whoami):$(whoami) /opt/ai-novel-generator/.git
```

---

> **文档维护**：AI 小说工坊 · 阿里云部署指南
> **最后更新**：2026 年 6 月
