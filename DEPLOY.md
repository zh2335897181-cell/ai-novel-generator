# AI小说生成器 - 阿里云服务器部署指南

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Ubuntu 22.04 LTS (推荐)
- **配置**: 2核4G内存以上
- **带宽**: 3Mbps以上
- **存储**: 20GB以上

### 2. 需要的工具
- SSH客户端 (Windows推荐 MobaXterm 或 Xshell)
- 你的服务器公网IP、用户名(root)、密码

---

## 🚀 快速部署步骤

### 步骤1: 连接服务器并更新系统

```bash
# SSH连接服务器 (在本地终端执行)
ssh root@114.55.57.152

# 更新系统软件包
apt update && apt upgrade -y
```

### 步骤2: 安装必要环境

```bash
# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# 验证安装
node -v  # 应显示 v20.x.x
npm -v   # 应显示 10.x.x

# 安装 PM2 (进程管理器)
npm install -g pm2

# 安装 MySQL
apt install -y mysql-server

# 安装 Nginx
apt install -y nginx

# 安装 Git
apt install -y git
```

### 步骤3: 配置 MySQL 数据库

```bash
# 启动 MySQL 并设置开机自启
systemctl start mysql
systemctl enable mysql

# 运行安全配置 (按提示设置root密码)
mysql_secure_installation

# 登录 MySQL 创建数据库
mysql -u root -p

# 在 MySQL 中执行以下命令：
CREATE DATABASE novel_generator DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'novel_user'@'localhost' IDENTIFIED BY '你的数据库密码';
GRANT ALL PRIVILEGES ON novel_generator.* TO 'novel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 步骤4: 上传项目代码

**方式A - 使用 Git (推荐):**
```bash
# 在服务器上克隆项目
   cd /opt
git clone https://github.com/你的用户名/ai-novel-generator.git
cd ai-novel-generator
```

**方式B - 使用 SFTP 上传:**
1. 使用 FileZilla 或 WinSCP 连接服务器
2. 将本地项目文件夹上传到 `/opt/ai-novel-generator`

### 步骤5: 导入数据库表结构

```bash
cd /opt/ai-novel-generator
cat database/schema.sql | mysql -u novel_user -p novel_generator
# 提示输入密码时输入你刚才设置的密码
```
zh2335897
### 步骤6: 配置后端环境变量

```bash
cd /opt/ai-novel-generator/backend

# 创建环境变量文件
cat > .env << 'EOF'

DB_HOST=localhost
DB_USER=novel_user
DB_PASSWORD=你的数据库密码
DB_NAME=novel_generator
DB_PORT=3306


AI_API_KEY=你的AI_API密钥
AI_BASE_URL=https://api.deepseek.com/v1  
AI_MODEL=deepseek-chat


JWT_SECRET=你的随机字符串至少32位


PORT=3000
EOF
```

### 步骤7: 启动后端服务

```bash
cd /opt/ai-novel-generator/backend

# 安装依赖
npm install

# 使用 PM2 启动 (生产环境推荐)
pm2 start src/index.js --name "novel-backend"

# 设置开机自启
pm2 startup
pm2 save

# 查看运行状态
pm2 status
pm2 logs novel-backend
```

### 步骤8: 构建前端

```bash
cd /opt/ai-novel-generator/frontend

# 安装依赖
npm install

# 修改 API 配置为生产环境
# 编辑 src/api/novel.js，将 BASE 改为 '/api'
# const BASE = '/api'

# 构建生产版本
npm run build

# 构建输出在 dist/ 文件夹
```

### 步骤9: 配置 Nginx 反向代理

```bash
# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/novel-generator << 'EOF'
server {
    listen 80;
    server_name 你的服务器公网IP;  # 或你的域名

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
        
        # 流式响应设置
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/novel-generator /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # 删除默认配置

# 测试配置并重启
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 步骤10: 配置防火墙

```bash
# 开放 HTTP (80) 和 HTTPS (443) 端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

---

## ✅ 验证部署

1. **访问前端**: 打开浏览器访问 `http://你的服务器公网IP`
   - 应该能看到登录页面

2. **测试后端**: 访问 `http://你的服务器公网IP/api/health`
   - 应该返回健康检查信息

3. **测试登录**: 使用测试账号登录
   - 用户名: `test`
   - 密码: `test`

4. **测试AI生成**: 配置AI参数后尝试生成一段内容

---

## 🔧 常用维护命令

```bash
# 查看后端日志
pm2 logs novel-backend

# 重启后端
pm2 restart novel-backend

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 重启 Nginx
systemctl restart nginx

# 更新代码后重新部署
cd /opt/ai-novel-generator
git pull
pm2 restart novel-backend
cd frontend && npm run build

# 备份数据库
mysqldump -u novel_user -p novel_generator > backup_$(date +%Y%m%d).sql
```

---

## 🛡️ 安全建议

1. **配置 HTTPS (推荐)**:
   ```bash
   # 安装 Certbot
   apt install -y certbot python3-certbot-nginx
   
   # 申请 SSL 证书
   certbot --nginx -d 你的域名
   ```

2. **修改默认测试账号密码**

3. **定期更新系统和依赖**:
   ```bash
   apt update && apt upgrade -y
   cd /opt/ai-novel-generator/backend && npm update
   cd /opt/ai-novel-generator/frontend && npm update
   ```

4. **配置数据库定期备份** (使用 cron 定时任务)

---

## 🆘 常见问题

### 问题1: 前端页面空白
- 检查 Nginx 配置中的 root 路径是否正确
- 确认前端已构建 `npm run build`

### 问题2: API 请求 502 错误
- 检查后端是否运行: `pm2 status`
- 检查端口是否被占用: `netstat -tlnp | grep 3000`

### 问题3: 数据库连接失败
- 检查 .env 中的数据库配置
- 确认 MySQL 运行: `systemctl status mysql`
- 检查用户权限: `mysql -u novel_user -p`

### 问题4: AI 生成无响应
- 检查 .env 中的 AI_API_KEY 是否配置
- 查看后端日志: `pm2 logs novel-backend`

---

## 📞 需要帮助?

如遇到问题，请提供以下信息：
1. 后端日志: `pm2 logs novel-backend --lines 50`
2. Nginx 错误日志: `tail /var/log/nginx/error.log`
3. 系统状态: `pm2 status && systemctl status nginx && systemctl status mysql`
