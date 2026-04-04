# 部署指南

## 本地开发环境

### 前置要求
- Node.js 16+
- MySQL 5.7+
- npm 或 yarn

### 快速启动（Windows）

双击运行 `start.bat`，脚本会自动：
1. 初始化数据库
2. 安装依赖
3. 启动后端和前端

### 手动启动

#### 1. 数据库初始化
```bash
mysql -u root -pzh2335897 < database/schema.sql
```

#### 2. 后端启动
```bash
cd backend
npm install
# 配置 .env 文件
npm run dev
```

#### 3. 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 生产环境部署

### 1. 数据库配置

```sql
-- 创建生产数据库
CREATE DATABASE ai_novel_db_prod CHARACTER SET utf8mb4;

-- 创建专用用户
CREATE USER 'novel_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON ai_novel_db_prod.* TO 'novel_user'@'localhost';
FLUSH PRIVILEGES;

-- 导入结构
mysql -u novel_user -p ai_novel_db_prod < database/schema.sql
```

### 2. 后端部署

#### 使用PM2
```bash
cd backend
npm install --production

# 安装PM2
npm install -g pm2

# 启动
pm2 start src/index.js --name "ai-novel-backend"

# 开机自启
pm2 startup
pm2 save
```

#### 环境变量（生产）
```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=novel_user
DB_PASSWORD=strong_password
DB_NAME=ai_novel_db_prod

AI_API_KEY=your-production-api-key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

### 3. 前端部署

#### 构建
```bash
cd frontend
npm install
npm run build
```

#### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/ai-novel/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 安全建议

1. 修改默认数据库密码
2. 配置防火墙规则
3. 启用HTTPS（Let's Encrypt）
4. 限制API请求频率
5. 添加用户认证

## Docker部署（可选）

### Dockerfile（后端）
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "src/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: zh2335897
      MYSQL_DATABASE: ai_novel_db
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: mysql
      DB_PASSWORD: zh2335897
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

启动：
```bash
docker-compose up -d
```

## 监控和维护

### 日志查看
```bash
# PM2日志
pm2 logs ai-novel-backend

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 数据库备份
```bash
# 备份
mysqldump -u novel_user -p ai_novel_db_prod > backup_$(date +%Y%m%d).sql

# 恢复
mysql -u novel_user -p ai_novel_db_prod < backup_20240101.sql
```

### 性能优化

1. 数据库索引优化
2. 启用Redis缓存
3. CDN加速静态资源
4. 数据库连接池调优

## 故障排查

### 后端无法连接数据库
```bash
# 检查MySQL服务
systemctl status mysql

# 检查连接
mysql -u root -p -e "SELECT 1"

# 检查端口
netstat -tlnp | grep 3306
```

### AI接口调用失败
- 检查API Key是否正确
- 检查网络连接
- 查看API配额

### 前端无法访问后端
- 检查CORS配置
- 检查Nginx代理配置
- 检查防火墙规则
