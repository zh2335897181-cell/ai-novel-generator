# Vercel + Railway 免费部署教程

## 📋 架构说明

```
┌─────────────────┐         ┌─────────────────────────┐
│   Vercel        │  HTTP   │   Railway               │
│  (前端免费)      │ <─────> │  ┌─────────────────┐   │
│  Next.js/Vue    │         │  │  Node.js 后端    │   │
│  静态托管       │         │  │  Express API     │   │
│                 │         │  └─────────────────┘   │
│                 │         │           │            │
│                 │         │  ┌─────────────────┐   │
│                 │         │  │  MySQL 数据库   │   │
│                 │         │  │  免费 500MB     │   │
│                 │         │  └─────────────────┘   │
└─────────────────┘         └─────────────────────────┘
```

## 🚀 第一步：准备 GitHub 仓库

### 1. 创建新仓库

登录 https://github.com/new
- 仓库名：`ai-novel-generator`
- 选择 Public（免费部署需要公开）
- 勾选 Add a README

### 2. 上传项目代码

```bash
# 本地项目目录执行
cd c:\Users\admin\Desktop\124375

# 初始化 git
git init

# 添加远程仓库（替换为你的地址）
git remote add origin https://github.com/zh2335897181-cell/ai-novel-generator.git

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 推送
git branch -M main
git push -u origin main
```

---

## 🌐 第二步：部署前端到 Vercel

### 1. 注册 Vercel

访问 https://vercel.com
- 用 GitHub 账号登录（一键授权）

### 2. 导入项目

1. 点击 **Add New Project**
2. 选择 GitHub 仓库 `ai-novel-generator`
3. 点击 **Import**

### 3. 配置部署

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 4. 环境变量（可选）

如果前端需要环境变量，点击 **Environment Variables**:

```
VITE_API_URL=https://你的railway域名.up.railway.app/api
```

### 5. 部署

点击 **Deploy**，等待 1-2 分钟

✅ **部署完成！** 你会获得一个域名：
`https://ai-novel-generator-xxx.vercel.app`

---

## 🚂 第三步：部署后端到 Railway

### 1. 注册 Railway

访问 https://railway.app
- 用 GitHub 登录
- 绑定信用卡（免费额度内不扣费，用于验证身份）

### 2. 新建项目

1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择 `ai-novel-generator` 仓库

### 3. 添加 MySQL 数据库

1. 点击 **New** → **Database** → **Add MySQL**
2. 等待数据库创建（约 30 秒）

### 4. 配置后端服务

1. 点击 **New** → **Deploy from GitHub repo**
2. 选择后端目录（如果整个仓库包含前后端，需要配置启动命令）

#### 方式A：整个仓库部署

在仓库根目录创建 `railway.json`：

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### 方式B：修改 package.json

在 `backend/package.json` 添加：

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

### 5. 配置环境变量

在 Railway 项目页面，点击 **Variables** → **New Variable**：

```
PORT=8080
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=${{MYSQLDATABASE}}
AI_API_KEY=sk-your-api-key-here
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

> 💡 Railway 会自动注入 MySQL 连接信息，使用 `${{变量名}}` 引用

### 6. 配置数据库初始化

Railway 的 MySQL 不会自动导入 schema，需要手动执行：

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 连接到你的项目
railway link

# 进入 MySQL 容器执行 SQL
railway mysql
# 然后粘贴 database/schema.sql 的内容执行
```

或者使用本地连接：

```bash
# 获取数据库连接信息（Railway 控制台查看）
mysql -h your-mysql-host -u your-user -p your-database < database/schema.sql
```

### 7. 部署后端

点击 **Deploy**，等待构建完成

✅ **后端部署完成！** 域名如：
`https://ai-novel-generator-backend.up.railway.app`

---

## 🔗 第四步：配置 CORS 跨域

### 修改 backend/src/index.js

在 Express 配置中添加 CORS：

```javascript
import cors from 'cors';

// 允许 Vercel 前端访问
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  // 你的 Vercel 域名
  'https://ai-novel-generator-xxx.vercel.app',
  // 如果有自定义域名
  'https://your-domain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

安装 CORS 包：

```bash
cd backend
npm install cors
```

提交更改：

```bash
git add .
git commit -m "Add CORS config for Vercel deployment"
git push
```

---

## 📝 第五步：配置前端 API 地址

### 方案A：环境变量（推荐）

修改 `frontend/.env.production`：

```env
VITE_API_URL=https://你的railway后端域名.up.railway.app/api
```

修改 `frontend/src/utils/request.js`：

```javascript
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
```

### 方案B：打包后手动修改（临时）

在 `frontend/dist/assets/index-xxx.js` 中搜索 `localhost:8080` 替换为 Railway 地址

---

## 🔄 第六步：自动部署配置

### Vercel 自动部署
已默认开启，每次 `git push` 到 main 分支自动重新部署

### Railway 自动部署
1. 进入 Railway 项目设置
2. 点击 **Triggers** → **Auto Deploy**
3. 开启 **Deploy on Push**

---

## 💰 免费额度说明

### Vercel（前端）
- ✅ 无限带宽
- ✅ 无限构建次数
- ✅ 支持自定义域名
- ❌ 函数执行时间 10秒限制（不影响静态网站）

### Railway（后端+数据库）
- ✅ $5/月 免费额度
- ✅ 每月约 500小时运行时间（足够用）
- ✅ 500MB MySQL 存储
- ❌ 超出后需付费或暂停服务

### 节省额度技巧

```bash
# 只在需要时启动 Railway 服务
# 不使用时点击 Stop 暂停

# 或使用 Sleep 模式（自动休眠）
```

---

## 🛠️ 故障排查

### 1. 前端无法连接后端

检查浏览器 Network 面板：
```
错误：CORS error
解决：确保后端 CORS 配置包含 Vercel 域名
```

### 2. Railway 数据库连接失败

```bash
# 检查环境变量是否正确注入
echo $MYSQLHOST

# 手动测试连接
mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE -e "SELECT 1"
```

### 3. AI 生成超时

Railway 免费版有请求时间限制，SSE 流式传输可能中断：

```javascript
// 修改后端超时设置
// backend/src/index.js
app.use((req, res, next) => {
  req.setTimeout(300000); // 5分钟
  next();
});
```

### 4. 前端路由 404

Vercel 需要配置 rewrite：

创建 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 📝 部署检查清单

- [ ] GitHub 仓库已创建并推送代码
- [ ] Vercel 项目已导入并部署成功
- [ ] Railway 项目和 MySQL 已创建
- [ ] Railway 环境变量已配置（特别是 AI_API_KEY）
- [ ] 数据库 schema 已导入
- [ ] 后端 CORS 已配置 Vercel 域名
- [ ] 前端 API URL 已指向 Railway
- [ ] 自动部署已开启

---

## 🎉 完成！

访问你的 Vercel 域名即可使用完整功能：
- 前端界面：`https://ai-novel-generator-xxx.vercel.app`
- 后端 API：`https://你的railway域名.up.railway.app/api`

每月费用：**$0**（在免费额度内）

---

## 📚 相关链接

- Vercel: https://vercel.com
- Railway: https://railway.app
- GitHub: https://github.com
- Railway CLI: https://docs.railway.app/develop/cli
