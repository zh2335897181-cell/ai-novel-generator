# AI Novel Generator - AI 小说生成器

基于 AI 的智能小说创作平台，支持流式生成、多角色协作、世界观管理、时间线编排、RAG 增强等功能。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 3 + Vite 5 | Composition API + `<script setup>` |
| **UI 组件库** | Element Plus 2.5 | 完整的中后台组件体系 |
| **状态管理** | Pinia 2 | 用户状态、AI 配置、小说编辑 |
| **路由** | Vue Router 4 | 含导航守卫，公开/认证/管理员三级路由 |
| **图表** | ECharts 6 | 角色成长图、统计仪表盘 |
| **虚拟滚动** | vue-virtual-scroller | 长列表性能优化 |
| **文档导出** | docx + jspdf + html2canvas | DOCX / PDF 导出 |
| **后端框架** | Express 4 | RESTful API + SSE 流式 |
| **数据库** | MySQL 8.0 + mysql2 | 结构化数据持久化 |
| **缓存** | ioredis (Redis) | 可选，AI 响应缓存 |
| **认证** | JWT + bcryptjs | Token 认证 + 密码哈希 |
| **AI 集成** | DeepSeek API (OpenAI 兼容) | Function Calling + 流式 |
| **测试** | Jest + Vitest + Playwright + Supertest | 后端单测 + 前端单测 + E2E |
| **部署** | PM2 + Nginx + Docker | 生产环境进程守护 + 反向代理 |

## 功能特性

### 核心创作
- **小说 CRUD** — 创建、编辑、列表、删除，支持标题和描述
- **AI 内容生成** — 大纲解析 → 章节大纲 → 目录生成 → 情节建议，完整创作流水线
- **流式生成 (SSE)** — Server-Sent Events 实时推送，写作过程可视化
- **角色管理** — 创建/编辑/删除角色，属性（等级/状态/装备）结构化管理
- **角色关系图** — ECharts 力导向图可视化角色关联，支持拖拽交互
- **角色成长图表** — 角色属性随时间变化趋势图
- **角色对话生成** — AI 驱动的多角色对话，保持角色一致性
- **世界观管理** — 世界规则、背景、魔法/科技体系结构化编辑
- **物品/地点管理** — 小说内物品状态追踪和地点管理
- **时间线编辑** — 拖拽式事件时间线，支持按章节/角色分类筛选
- **RAG 增强生成** — 基于小说上下文的检索增强，提升生成连贯性

### 协作与发布
- **多人协作** — 邀请用户协作编辑，权限（只读/编辑/管理）控制
- **小说发布** — 一键发布/取消发布，生成公开分享链接
- **公开书架** — 所有已发布小说公开展示，支持搜索浏览
- **公开阅读** — 免登录阅读模式，移动端适配
- **内容审核** — 提交审核 → AI 自动检测 → 人工审核 → 反馈修改闭环

### 管理后台 (`/admin`)
- **仪表盘** — 用户数、小说数、审核队列、系统概览统计
- **用户管理** — 用户列表、角色分配（超级管理员/次管理员/普通用户）、状态管理
- **次管理员** — 创建/删除次管理员，分配管理权限
- **内容审核** — 审核队列、通过/拒绝、AI 辅助审核、驳回理由反馈
- **举报处理** — 用户举报接收、处理、反馈
- **敏感词库** — 敏感词增删改查、批量导入、测试匹配
- **邀请码** — 生成/管理注册邀请码、有效期设置
- **受信任设备** — 设备管理、远程撤销
- **系统设置** — 站点配置、AI 参数全局默认值
- **操作日志** — 管理员操作审计追踪

### 用户体验
- **响应式布局** — 桌面端（侧边栏 + 主内容区）+ 移动端（底部导航栏）
- **骨架屏** — 页面加载态骨架屏动画，减少等待焦虑
- **暗黑模式** — 明/暗主题切换，跟随系统偏好
- **命令面板** — `Ctrl+K` 全局搜索 + 快捷导航
- **Cookie 同意** — GDPR 合规弹窗
- **反馈对话框** — 用户问题反馈收集
- **使用指南** — 内置新手引导，功能说明
- **导出** — DOCX / PDF 格式导出小说内容
- **打印样式** — 专用打印 CSS，排版优化
- **游客模式** — 10 分钟体验，数据可导入正式账号

### 合规页面
- 隐私政策 (`/privacy`)
- 服务条款 (`/terms`)

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (Vue 3 + Vite)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  Landing │ │ NovelList│ │NovelDetail│ │  Admin  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │            │       │
│  ┌────┴────────────┴────────────┴────────────┴────┐  │
│  │              Pinia Store (user)                │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              API Layer (api/novel.js)           │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │ HTTP/SSE
┌───────────────────────┼──────────────────────────────┐
│              后端 (Express + MySQL)                   │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              中间件层                            │  │
│  │  CORS → Security Headers → Rate Limiter → Auth │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              路由层 (routes/)                   │  │
│  │   index.js (主路由)  +  admin.js (管理路由)     │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              控制器层 (controllers/)             │  │
│  │   auth / novel / admin / timeline               │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              服务层 (services/)                  │  │
│  │  novelService / CharacterService /              │  │
│  │  WorldStateService / ragService / cacheService  │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              工具层 (utils/)                     │  │
│  │  aiClient / flowControl / functionCalling       │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────┐                  │
│  │    MySQL (主存储)  │  Redis    │                  │
│  └────────────────────┴───────────┘                  │
└──────────────────────────────────────────────────────┘
```

### 认证流程

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│ 注册/登录 │ ──▶ │ JWT 签发 │ ──▶ │ Token 存储 │
└──────────┘     └──────────┘     └───────────┘
                                       │
         ┌─────────────────────────────┤
         ▼                             ▼
   ┌──────────┐                 ┌──────────┐
   │ 游客模式  │                 │ 管理员    │
   │ 10分钟   │                 │ JWT +    │
   │ 自动过期  │                 │ AdminKey │
   └──────────┘                 └──────────┘
```

### AI 生成流水线

```
用户输入 → 大纲解析 → 章节规划 → 目录生成 → 逐章生成
                │          │          │          │
                ▼          ▼          ▼          ▼
           AI Function  AI Chat    AI Chat   SSE Stream
           Calling      + RAG      + RAG     + RAG
```

## 数据库设计

### 核心表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `user` | 用户表 | id, username, password, role, status |
| `novel` | 小说表 | id, user_id, title, status, is_published |
| `story_content` | 故事内容 | id, novel_id, content, word_count |
| `story_summary` | 故事摘要 | id, novel_id, summary |
| `world_state` | 世界设定 | id, novel_id, rules, background, extra(JSON) |
| `character_state` | 角色状态 | id, novel_id, name, level, status, attributes(JSON) |
| `item_state` | 物品状态 | id, novel_id, name, type, owner, status, attributes(JSON) |
| `location_state` | 地点状态 | id, novel_id, name, type, status, description |
| `timeline_events` | 时间线 | id, novel_id, title, event_date, type, importance |

### 扩展表（增量迁移脚本）

| 文件 | 说明 |
|------|------|
| `schema.sql` | 基础表结构 |
| `add_tables.sql` | 协作、审核、系统配置等扩展表 |
| `add_features.sql` | 章节管理、AI 配置等特性表 |
| `add_minor_characters.sql` | 配角/次要角色 |
| `add_writing_style.sql` | 写作风格配置 |
| `add_rag_chunk.sql` | RAG 文本块存储 |
| `add_indexes.sql` | 性能索引优化 |
| `add_admin_columns.sql` | 管理员/审核/敏感词/设备管理字段 |

## 项目结构

```
├── backend/
│   ├── generate-hash.js           # 密码哈希生成工具
│   ├── migrate_phase2.js          # 数据库迁移脚本
│   └── src/
│       ├── index.js               # 服务入口：Express 配置、中间件、启动
│       ├── config/
│       │   └── database.js        # MySQL 连接池配置
│       ├── controllers/
│       │   ├── authController.js  # 注册/登录/个人信息
│       │   ├── novelController.js # 小说 CRUD、生成、角色、世界观、审核
│       │   ├── adminController.js # 仪表盘、用户管理、审核、敏感词、日志
│       │   └── timelineController.js # 时间线事件 CRUD
│       ├── entity/                # 数据实体定义
│       ├── repositories/          # SQL 查询封装层
│       ├── routes/
│       │   ├── index.js           # 主路由（认证、小说、AI、时间线、测试）
│       │   └── admin.js           # 管理员路由（全部需 adminAuth 中间件）
│       ├── services/
│       │   ├── novelService.js    # 小说核心业务逻辑（生成、发布、导出等）
│       │   ├── CharacterService.js # 角色管理服务
│       │   ├── WorldStateService.js # 世界观管理服务
│       │   ├── ragService.js      # RAG 检索增强服务
│       │   ├── cacheService.js    # Redis 缓存服务
│       │   └── sensitiveWordService.js # 敏感词检测服务
│       └── utils/
│           ├── aiClient.js        # AI API 客户端（配置解析、请求封装）
│           ├── flowControl.js     # 生成流程编排
│           ├── functionCalling.js # AI Function Calling 工具定义
│           ├── hallucinationCollector.js # AI 幻觉检测收集
│           └── testRunner.js      # 自动化验证测试
├── frontend/
│   └── src/
│       ├── main.js               # 应用入口
│       ├── api/
│       │   ├── novel.js           # 主 API 封装（请求/响应拦截、token 注入）
│       │   └── admin.js           # 管理 API 封装
│       ├── router/
│       │   └── index.js           # 路由定义 + beforeEach 导航守卫
│       ├── stores/
│       │   └── user.js            # Pinia 用户状态（登录/游客/解锁/计时）
│       ├── components/
│       │   ├── layout/            # 布局组件（导航栏等）
│       │   ├── common/            # 通用组件
│       │   ├── skeleton/          # 骨架屏组件
│       │   ├── RelationshipVisualization.vue  # 角色关系可视化
│       │   ├── CharacterGrowthChart.vue       # 角色成长图表
│       │   ├── TimelineManager.vue            # 时间线管理器
│       │   ├── AIConfigDialog.vue             # AI 配置对话框
│       │   ├── CommandPalette.vue             # 命令面板 (Ctrl+K)
│       │   ├── CookieConsent.vue             # Cookie 同意弹窗
│       │   ├── FeedbackDialog.vue            # 反馈对话框
│       │   └── UsageGuideDialog.vue          # 使用指南
│       └── views/
│           ├── Landing.vue       # 首页/落地页
│           ├── Login.vue         # 登录注册页
│           ├── NovelList.vue     # 我的小说列表
│           ├── NovelDetail.vue   # 小说编辑器（核心页面，139KB）
│           ├── AIConfig.vue      # AI 参数配置
│           ├── BookShelf.vue     # 公开书架
│           ├── PublicRead.vue    # 公开阅读页
│           ├── Admin.vue         # 管理后台（62KB，完整管理功能）
│           ├── PrivacyPolicy.vue # 隐私政策
│           ├── TermsOfService.vue # 服务条款
│           └── MobileTest.vue    # 移动端测试页
├── database/                     # SQL 迁移文件
├── docker/                       # Docker 配置
├── docs/                         # 文档
├── .github/                      # GitHub CI/CD
├── start.bat / stop.bat          # Windows 启动/停止脚本
├── force-stop.bat                # 强制停止脚本
└── DEPLOY.md                     # 生产部署指南
```

## 快速开始

### 前置要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 18.x | 推荐 20 LTS |
| MySQL | ≥ 8.0 | 或 MariaDB 10.5+ |
| Redis | ≥ 6.0 | 可选，用于缓存和会话 |
| npm | ≥ 9.x | 随 Node.js 发行 |

### 1. 克隆项目

```bash
git clone https://github.com/zh2335897181-cell/ai-novel-generator.git
cd ai-novel-generator
```

### 2. 初始化数据库

```bash
# 导入基础表结构
mysql -u root -p < database/schema.sql

# 按需导入增量迁移（按时间顺序）
mysql -u root -p ai_novel_db < database/add_tables.sql
mysql -u root -p ai_novel_db < database/add_features.sql
mysql -u root -p ai_novel_db < database/add_minor_characters.sql
mysql -u root -p ai_novel_db < database/add_writing_style.sql
mysql -u root -p ai_novel_db < database/add_rag_chunk.sql
mysql -u root -p ai_novel_db < database/add_indexes.sql
mysql -u root -p ai_novel_db < database/add_admin_columns.sql
```

> **提示**：基础 `schema.sql` 已包含测试用户 `test/test`。

### 3. 配置并启动后端

```bash
cd backend
npm install

# 创建环境变量文件
cat > .env << 'EOF'
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=ai_novel_db
DB_PORT=3306

AI_API_KEY=sk-your-deepseek-api-key
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

JWT_SECRET=your-random-secret-at-least-32-chars
ADMIN_KEY=your-admin-setup-key

PORT=3000
NODE_ENV=development
EOF

# 启动开发服务器
npm run dev
```

**环境变量完整说明：**

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `DB_HOST` | 是 | `localhost` | MySQL 主机地址 |
| `DB_USER` | 是 | `root` | MySQL 用户名 |
| `DB_PASSWORD` | 是 | - | MySQL 密码 |
| `DB_NAME` | 是 | `ai_novel_db` | 数据库名称 |
| `DB_PORT` | 否 | `3306` | MySQL 端口 |
| `AI_API_KEY` | 是 | - | DeepSeek API 密钥 |
| `AI_BASE_URL` | 是 | `https://api.deepseek.com/v1` | AI API 地址（兼容 OpenAI 格式即可） |
| `AI_MODEL` | 是 | `deepseek-chat` | AI 模型名称 |
| `JWT_SECRET` | 是 | - | JWT 签名密钥（生产环境至少 32 字符） |
| `ADMIN_KEY` | 否 | - | 管理员初始化密钥（用于首次设置） |
| `PORT` | 否 | `8080` | 后端监听端口 |
| `NODE_ENV` | 否 | `development` | 运行环境（development/production） |
| `ALLOWED_ORIGINS` | 否 | - | 生产环境 CORS 白名单（逗号分隔） |
| `REDIS_URL` | 否 | - | Redis 连接地址（不配置则跳过缓存） |

### 4. 配置并启动前端

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，通过 Vite proxy 将 `/api` 请求转发到后端 `http://localhost:3000`。

### 5. 验证安装

1. 浏览器打开 `http://localhost:5173`
2. 使用测试账号登录：用户名 `test`，密码 `test`
3. 创建一本小说，配置 AI 参数后即可开始生成

### Docker 部署（可选）

```bash
# 使用 docker-compose 一键启动
cd docker
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看后端日志
docker-compose logs -f backend
```

## 完整 API 参考

### 认证 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 否 | 用户注册（支持邀请码） |
| POST | `/api/auth/login` | 否 | 用户登录（支持管理员验证码） |
| GET | `/api/auth/me` | JWT | 获取当前用户详细信息 |

### 小说 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/novels` | JWT/游客 | 创建小说 |
| GET | `/api/novels` | JWT/游客 | 获取用户的小说列表 |
| GET | `/api/novels/:id` | JWT/游客 | 获取小说详情（含角色、世界、内容） |
| DELETE | `/api/novels/:id` | JWT | 删除小说及其关联数据 |
| POST | `/api/novels/:id/publish` | JWT | 发布小说到公开书架 |
| POST | `/api/novels/:id/unpublish` | JWT | 取消发布 |

### AI 生成 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/novels/generate` | JWT/游客 | AI 内容生成（非流式） |
| POST | `/api/novels/generate-stream` | JWT/游客 | AI 内容生成（SSE 流式，实时推送） |
| POST | `/api/novels/parse-outline` | JWT/游客 | AI 解析故事大纲 |
| POST | `/api/novels/chapter-outlines` | JWT/游客 | AI 生成章节大纲 |
| POST | `/api/novels/toc` | JWT/游客 | AI 生成小说目录 |
| POST | `/api/novels/plot-suggestions` | JWT/游客 | AI 情节建议 |
| POST | `/api/novels/:id/dialogue` | JWT/游客 | AI 生成角色对话 |

### 角色与世界 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/novels/characters` | JWT/游客 | 添加/更新角色 |
| GET | `/api/novels/:id/characters` | JWT/游客 | 获取小说角色列表 |
| PUT | `/api/novels/world` | JWT/游客 | 更新世界观设定 |

### 协作 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/novels/:id/collaborators` | JWT | 获取协作者列表 |
| POST | `/api/novels/:id/collaborators` | JWT | 邀请协作者 |
| PUT | `/api/novels/:id/collaborators/:userId` | JWT | 修改协作者权限 |
| DELETE | `/api/novels/:id/collaborators/:userId` | JWT | 移除协作者 |

### 审核 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/novels/:id/reviews` | JWT | 获取小说的审核记录 |
| POST | `/api/novels/:id/resubmit-review` | JWT | 修改后重新提交审核 |

### 公开访问 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/public/bookshelf` | 否 | 获取公开书架（已发布小说列表） |
| GET | `/api/public/novels/:id` | 否 | 获取公开小说详情（只读） |

### AI 聊天 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/ai/chat` | JWT | 通用 AI 对话（非流式） |
| POST | `/api/ai/chat-stream` | JWT | 通用 AI 对话（SSE 流式） |

### 时间线 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/novels/:id/timeline` | JWT | 获取小说时间线事件 |
| POST | `/api/novels/:id/timeline` | JWT | 创建时间线事件 |
| PUT | `/api/timeline/:eventId` | JWT | 更新时间线事件 |
| DELETE | `/api/timeline/:eventId` | JWT | 删除时间线事件 |

### 管理后台 API（全部需要管理员权限）

#### 仪表盘
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/init` | 初始化数据库表结构 |
| GET | `/api/admin/dashboard` | 仪表盘统计数据 |

#### 用户管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表（支持分页/搜索） |
| PUT | `/api/admin/users/:userId/status` | 更新用户状态 |
| PUT | `/api/admin/users/:userId/role` | 更新用户角色 |
| DELETE | `/api/admin/users/:userId` | 删除用户 |

#### 次管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/sub-admins` | 次管理员列表 |
| POST | `/api/admin/sub-admins` | 创建次管理员 |
| DELETE | `/api/admin/sub-admins/:userId` | 删除次管理员 |

#### 内容审核
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/reviews` | 审核队列 |
| POST | `/api/admin/reviews` | 提交审核 |
| PUT | `/api/admin/reviews/:reviewId` | 审核操作 |
| POST | `/api/admin/reviews/:reviewId/ai-check` | AI 辅助审核检测 |

#### 举报管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/reports` | 举报列表 |
| POST | `/api/admin/reports` | 创建举报 |
| PUT | `/api/admin/reports/:reportId` | 处理举报 |

#### 小说管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/novels` | 全部小说列表 |
| GET | `/api/admin/novels/:novelId` | 小说详情 |
| PUT | `/api/admin/novels/:novelId/status` | 更新小说状态 |
| DELETE | `/api/admin/novels/:novelId` | 删除小说 |

#### 敏感词管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/sensitive-words` | 敏感词列表 |
| POST | `/api/admin/sensitive-words` | 添加敏感词 |
| POST | `/api/admin/sensitive-words/batch` | 批量导入敏感词 |
| PUT | `/api/admin/sensitive-words/:wordId` | 更新敏感词 |
| DELETE | `/api/admin/sensitive-words/:wordId` | 删除敏感词 |
| POST | `/api/admin/sensitive-words/test` | 测试文本匹配 |

#### 系统管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/logs` | 操作日志列表 |
| GET | `/api/admin/settings` | 系统配置 |
| PUT | `/api/admin/settings` | 更新系统配置 |
| GET | `/api/admin/devices` | 受信任设备列表 |
| DELETE | `/api/admin/devices/:deviceId` | 撤销设备 |
| GET | `/api/admin/invite-codes` | 邀请码列表 |
| POST | `/api/admin/invite-codes` | 生成邀请码 |
| PUT | `/api/admin/invite-codes/:codeId` | 更新邀请码 |
| DELETE | `/api/admin/invite-codes/:codeId` | 删除邀请码 |

### 测试 API

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/tests/run` | 否 | 运行全量自动化测试 |
| POST | `/api/tests/run-validation` | 否 | 运行验证测试套件 |

## 安全特性

| 特性 | 实现 |
|------|------|
| **密码加密** | bcryptjs 哈希 + 盐值 |
| **JWT 认证** | HS256 签名，支持过期控制 |
| **速率限制** | 基于 IP 的内存限流（60s/100次） |
| **安全响应头** | X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy |
| **CSRF 防护** | 状态变更请求 Origin/Referer 检查 |
| **CORS 控制** | 生产环境白名单，开发环境宽松 |
| **管理员认证** | JWT 角色验证 + AdminKey 双重认证 |
| **游客隔离** | 独立游客用户 + IP 锁定 + 10分钟时限 |
| **设备指纹** | 登录设备追踪，远程撤销 |
| **敏感词过滤** | 可配置敏感词库 + 实时检测 |
| **操作审计** | 管理员操作日志记录 |
| **SQL 注入防护** | mysql2 参数化查询 |
| **邀请码注册** | 可选邀请码控制注册 |

## 开发指南

### 目录约定

```
backend/src/
  controllers/  → 处理 HTTP 请求/响应，参数校验，调用 service
  services/     → 核心业务逻辑，与 controller 一对一或多对一
  repositories/ → 数据库查询封装，与表一对一
  utils/        → 无状态工具函数
  routes/       → 路由定义 + 中间件绑定
  config/       → 环境变量、数据库连接等配置
```

### 本地开发

```bash
# 终端1 - 启动后端
cd backend && npm run dev

# 终端2 - 启动前端
cd frontend && npm run dev
```

前端 Vite 配置了代理：`/api` → `http://localhost:3000`，开发时无需额外配置。

### 测试

```bash
# 后端单元测试（Jest）
cd backend
npm test
npm run test:watch      # 监听模式
npm run test:coverage   # 覆盖率报告

# 前端单元测试（Vitest）
cd frontend
npm test
npm run test:ui         # Vitest UI 界面
npm run test:coverage   # 覆盖率报告

# E2E 测试（Playwright）
cd frontend
npm run test:e2e        # 命令行运行
npm run test:e2e:ui     # Playwright UI 模式
```

### 数据库迁移

项目使用增量 SQL 迁移（无 ORM 迁移工具）：

1. 在 `database/` 目录创建新的 SQL 文件
2. 按需在目标环境手动执行：`mysql -u root -p ai_novel_db < database/your_migration.sql`
3. 或使用后端迁移脚本：`node backend/migrate_phase2.js`

### 代码规范

- 后端使用 ES Module (`"type": "module"`)
- 前端使用 Composition API + `<script setup>`
- API 请求通过 `frontend/src/api/novel.js` 统一管理（axios 实例 + 拦截器）
- 敏感信息（API Key、密码）仅存储在 `.env`，不提交到 Git

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+K` | 打开命令面板 |

## 部署

完整生产环境部署指南请参阅 [DEPLOY.md](./DEPLOY.md)，包含：

- Ubuntu 22.04 服务器环境搭建
- MySQL 安装与配置
- Nginx 反向代理 + 静态资源
- PM2 进程守护
- SSL/HTTPS 配置
- 防火墙设置
- 常见问题排查

### 快速部署检查清单

- [ ] MySQL 数据库已创建并导入表结构
- [ ] `.env` 文件已配置正确的数据库密码和 AI API Key
- [ ] `JWT_SECRET` 已设置为随机字符串（≥32字符）
- [ ] 前端已构建 (`npm run build`)
- [ ] Nginx 已配置反向代理
- [ ] PM2 已启动后端进程
- [ ] 防火墙已开放 80/443 端口
- [ ] HTTPS 证书已配置（推荐）

## License

MIT
