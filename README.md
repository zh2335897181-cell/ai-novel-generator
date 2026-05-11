<p align="center">
  <h1 align="center">NovelForge / AI 小说工坊</h1>
  <p align="center">AI-Assisted Long-Form Fiction Authoring Platform<br/>基于大语言模型的智能长篇小说创作平台</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/vue-3.x-4fc08d" alt="Vue">
  <img src="https://img.shields.io/badge/express-4.x-000000" alt="Express">
  <img src="https://img.shields.io/badge/mysql-8.0-4479A1" alt="MySQL">
</p>

---

## Table of Contents / 目录

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Capabilities](#core-capabilities)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Configuration Reference](#configuration-reference)
- [API Reference](#api-reference)
- [Security Model](#security-model)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

## Overview

NovelForge is a full-stack web application that integrates large language models (LLMs) into the long-form fiction writing workflow. It provides structured tools for narrative planning, character management, world-building, and iterative content generation — designed to augment, not replace, the author's creative process.

> **NovelForge** 是一个将大语言模型深度整合进长篇小说创作工作流的全栈 Web 应用。提供从叙事规划、角色管理、世界观构建到迭代式内容生成的完整工具链，旨在增强而非取代创作者的写作过程。

**Key Design Principles / 核心设计原则：**

| Principle | Description |
|---|---|
| **Structured State** 结构化状态 | Characters, items, locations, and world rules are modeled as structured entities — not free-text — enabling consistent AI generation across long contexts. 角色、物品、地点、世界规则均建模为结构化实体而非自由文本，确保 AI 在超长上下文中保持一致性。 |
| **Streaming-First** 流式优先 | All AI content is delivered via Server-Sent Events for real-time feedback. 所有 AI 生成内容通过 SSE 实时推送，写作过程即时可见。 |
| **RAG Augmented** 检索增强 | Relevant narrative context is retrieved and injected into prompts to maintain cross-chapter continuity. 自动检索相关前文注入 prompt，保障跨章节的叙事连贯性。 |
| **Layered Architecture** 分层架构 | Controller → Service → Repository layering with clear separation of HTTP, business logic, and data access concerns. 严格分层，HTTP 处理、业务逻辑、数据访问各司其职。 |

## Architecture

**System Architecture / 系统架构：**

```
Request  →  Middleware Chain  →  Router  →  Controller  →  Service  →  Repository  →  MySQL
              │                                                              │
              ├─ CORS                                                        ├─ Redis (cache)
              ├─ Security Headers                                            └─ LLM API
              ├─ Rate Limiter                                                    │
              ├─ JWT / Guest Auth                                            DeepSeek
              └─ Admin Auth                                                  (OpenAI-compatible)
```

**Authentication Flow / 认证流程：**

```
                    ┌──────────┐
                    │  Request │
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │ Public route? 公开?  │── Yes ──▶ Pass through
              └──────────┬──────────┘
                         │ No
              ┌──────────▼──────────┐
              │ Bearer token valid? │── Yes ──▶ JWT session
              └──────────┬──────────┘
                         │ No
              ┌──────────▼──────────┐
              │ Guest mode? 游客?    │── Yes ──▶ Temp account (10min TTL)
              └──────────┬──────────┘
                         │ No
                         ▼
                    401 Unauthorized
```

**Generation Pipeline / 生成流水线：**

```
Free-text Outline 自由大纲 → parse-outline → Structured Outline 结构化大纲
                                                 │
                          ┌──────────────────────┼──────────────────────┐
                          ▼                      ▼                      ▼
                   chapter-outlines            toc              plot-suggestions
                    章节大纲生成             目录生成              情节建议
                          │
                          ▼
                generate / generate-stream (SSE)
                          │
                          ├─ RAG context retrieval    上下文检索
                          ├─ Character state injection 角色状态注入
                          ├─ World rule enforcement    世界规则约束
                          └─ Streaming token output    流式输出
```

**Frontend Component Tree / 前端组件树：**

```
App
├─ Landing (public 公开)
├─ Login / Register (登录/注册)
├─ NovelList (小说列表)
│   └─ NovelCard[]
├─ NovelDetail (主编编辑器 ~3200 LOC)
│   ├─ AI Config Panel (AI 配置)
│   ├─ Character Manager (角色管理)
│   │   ├─ Character Form
│   │   └─ Relationship Graph (关系图谱 · ECharts)
│   ├─ World Builder (世界观)
│   ├─ Timeline Manager (时间线)
│   ├─ Chapter Editor (章节编辑)
│   │   └─ SSE Stream Receiver
│   └─ Export (DOCX / PDF)
├─ BookShelf (公开书架)
├─ PublicRead (公开阅读)
└─ Admin Dashboard (管理后台 ~1800 LOC)
    ├─ User Management (用户管理)
    ├─ Review Queue (审核队列)
    ├─ Sensitive Words (敏感词库)
    ├─ Invite Codes (邀请码)
    └─ System Settings (系统设置)
```

## Core Capabilities

### Narrative Generation / 叙事生成

| Capability 功能 | Endpoint | Description 说明 |
|---|---|---|
| Outline Parsing 大纲解析 | `parse-outline` | Convert free-text outline into structured chapter plans via function calling. 通过 Function Calling 将自由大纲转为结构化章节计划。 |
| Chapter Outlining 章节大纲 | `chapter-outlines` | Generate detailed scene-by-scene chapter outlines. 生成包含场景分解的详细章节大纲。 |
| Table of Contents 目录生成 | `toc` | Produce hierarchical chapter structure with word-count estimates. 生成带字数预估的层级目录结构。 |
| Plot Suggestions 情节建议 | `plot-suggestions` | Context-aware narrative branching suggestions. 基于上下文的叙事分支建议。 |
| Content Generation 内容生成 | `generate` / `generate-stream` | Full chapter generation with SSE streaming. 流式/批量章节内容生成。 |
| Dialogue Synthesis 对话生成 | `:id/dialogue` | Multi-character dialogue with persona consistency. 保持角色一致性的多人对话生成。 |

### Entity Management / 实体管理

- **Characters 角色** — Structured attributes (level, status, equipment), JSON extensibility. 结构化属性（等级、状态、装备），JSON 扩展字段。
- **Relationships 关系** — ECharts force-directed graph, type-labeled edges. 力导向图可视化，关系类型标注。
- **World State 世界观** — Rules engine, background lore, extensible properties (magic, technology tier). 规则引擎、背景传说、可扩展属性体系。
- **Items & Locations 物品与地点** — State-tracked inventory and geography with ownership/status lifecycle. 状态追踪的物品与地点管理。
- **Timeline 时间线** — Chronological events with character/chapter cross-referencing. 按时间排序的事件，支持角色/章节交叉引用。

### Collaboration & Publishing / 协作与发布

- Role-based collaborator permissions (viewer / editor / manager). 基于角色的协作权限（只读/编辑/管理）。
- One-click publish/unpublish with public share links. 一键发布/取消发布，生成公开链接。
- Public bookshelf with search and filtering. 公开书架支持搜索筛选。
- Anonymous read-only access for published works. 免登录只读访问。
- Review pipeline: submission → AI audit → manual adjudication → revision feedback. 审核流水线：提交 → AI 辅助审查 → 人工裁定 → 修改反馈。

### Administration / 管理后台

- **Dashboard 仪表盘** — User registrations, novel count, review queue depth. 用户注册数、小说数、审核队列深度。
- **User Management 用户管理** — Role assignment (super_admin / admin / user), status control. 角色分配、状态管理。
- **Sub-Admin Delegation 次管理员** — Granular privilege creation and revocation. 细粒度管理员权限授予与撤销。
- **Review Queue 审核队列** — Inline content inspection, approve/reject with rationale. 在线内容检查、通过/拒绝并附理由。
- **Report Handling 举报处理** — User report triage and resolution. 用户举报受理与处理。
- **Sensitive Words 敏感词库** — CRUD, batch import, real-time match testing. 增删改查、批量导入、实时匹配测试。
- **Invite Codes 邀请码** — Registration gating with expiration policy. 注册邀请码及有效期管理。
- **Device Management 设备管理** — Trusted device tracking, remote session revocation. 受信任设备追踪、远程会话撤销。
- **Audit Log 操作日志** — Immutable admin action record. 管理员操作审计追踪。

### User Experience / 用户体验

- Responsive: sidebar + workspace (desktop), bottom tab bar (mobile). 响应式：桌面端侧边栏，移动端底部导航。
- Skeleton screen placeholders during async loads. 骨架屏加载态。
- Dark/light theme with system preference detection. 明暗主题，跟随系统偏好。
- Command palette (`Ctrl+K`) for keyboard-driven navigation. 命令面板键盘导航。
- GDPR cookie consent banner. Cookie 同意合规弹窗。
- Guest mode: 10-minute trial, data importable to permanent account. 游客模式：10 分钟体验，数据可导入正式账号。

## Project Structure

```
novelforge/
├── backend/
│   ├── src/
│   │   ├── index.js                    # Express bootstrap, middleware, lifecycle
│   │   ├── config/database.js          # MySQL connection pool 连接池
│   │   ├── controllers/                # HTTP handlers 控制器
│   │   │   ├── authController.js       # Registration, login, session
│   │   │   ├── novelController.js      # CRUD, generation, characters, world
│   │   │   ├── adminController.js      # Dashboard, users, reviews, config
│   │   │   └── timelineController.js   # Event CRUD
│   │   ├── routes/                     # Route definitions 路由
│   │   │   ├── index.js                # Public + authenticated endpoints
│   │   │   └── admin.js                # Admin-only (adminAuth guard)
│   │   ├── services/                   # Business logic 业务逻辑
│   │   │   ├── novelService.js         # Core generation & publishing
│   │   │   ├── CharacterService.js     # Character lifecycle
│   │   │   ├── WorldStateService.js    # World rules & background
│   │   │   ├── ragService.js           # Context retrieval for prompts
│   │   │   ├── cacheService.js         # Redis caching layer
│   │   │   └── sensitiveWordService.js # Content filtering
│   │   ├── repositories/               # Parameterized SQL queries
│   │   ├── entity/                     # Data shape definitions
│   │   └── utils/
│   │       ├── aiClient.js             # LLM client abstraction
│   │       ├── flowControl.js          # Generation workflow orchestrator
│   │       ├── functionCalling.js      # Tool-use schema definitions
│   │       ├── hallucinationCollector.js # Consistency validation
│   │       └── testRunner.js           # Automated validation suite
│   ├── generate-hash.js                # bcrypt hash utility
│   └── migrate_phase2.js               # Schema migration runner
├── frontend/
│   └── src/
│       ├── main.js                     # App entry
│       ├── api/
│       │   ├── novel.js                # Axios instance + interceptors
│       │   └── admin.js                # Admin API client
│       ├── router/index.js             # Route map + guards 路由守卫
│       ├── stores/user.js              # Pinia: auth, guest, unlock state
│       ├── components/
│       │   ├── layout/                 # Shell components 布局
│       │   ├── common/                 # Shared utilities 通用
│       │   ├── skeleton/               # Loading placeholders 骨架屏
│       │   ├── RelationshipVisualization.vue  # ECharts force graph
│       │   ├── CharacterGrowthChart.vue       # Growth charts
│       │   ├── TimelineManager.vue            # Timeline editor
│       │   ├── AIConfigDialog.vue             # AI configuration
│       │   ├── CommandPalette.vue             # Ctrl+K palette
│       │   ├── CookieConsent.vue              # GDPR banner
│       │   ├── FeedbackDialog.vue             # User feedback
│       │   └── UsageGuideDialog.vue           # Onboarding guide
│       └── views/
│           ├── Landing.vue             # Home / 首页
│           ├── Login.vue               # Auth / 登录注册
│           ├── NovelList.vue           # Novel list / 小说列表
│           ├── NovelDetail.vue         # Main editor / 主编编辑器
│           ├── AIConfig.vue            # AI settings / AI 配置
│           ├── BookShelf.vue           # Public shelf / 公开书架
│           ├── PublicRead.vue          # Public reader / 公开阅读
│           ├── Admin.vue               # Admin panel / 管理后台
│           ├── PrivacyPolicy.vue       # 隐私政策
│           ├── TermsOfService.vue      # 服务条款
│           └── MobileTest.vue          # Mobile testing
├── database/                           # Incremental SQL migrations
│   ├── schema.sql                      # Core tables 核心表
│   ├── add_tables.sql                  # Collaboration, reviews, config
│   ├── add_features.sql                # Chapters, AI configs
│   ├── add_minor_characters.sql        # Supporting cast
│   ├── add_writing_style.sql           # Style profiles
│   ├── add_rag_chunk.sql               # RAG text chunking
│   ├── add_indexes.sql                 # Performance optimization
│   └── add_admin_columns.sql           # Admin, review, device fields
├── docker/                             # Compose configuration
├── docs/                               # Extended documentation
├── DEPLOY.md                           # Production deployment guide
└── README.md
```

## Database Schema

### Core Domain Tables / 核心业务表

| Table 表 | Purpose 用途 | Constraints 约束 |
|---|---|---|
| `user` | Account registry 用户账号 | UNIQUE username, bcrypt password |
| `novel` | Novel metadata 小说元数据 | FK → user, is_published |
| `story_content` | Generated prose 故事正文 | FK → novel, word_count |
| `story_summary` | Plot synopsis 剧情摘要 | UNIQUE per novel |
| `world_state` | World rules & background 世界设定 | UNIQUE per novel, JSON extra |
| `character_state` | Character definitions 角色定义 | UNIQUE (novel_id, name), JSON attrs |
| `item_state` | In-world items 物品 | UNIQUE (novel_id, name), owner tracking |
| `location_state` | Geography & locations 地点 | UNIQUE (novel_id, name), typed |
| `timeline_events` | Chronological events 时间线 | FK → novel, importance 1–5 |

### Migration Order / 迁移顺序

1. `schema.sql` — Foundation: users, novels, world, characters, items, locations, timeline
2. `add_tables.sql` — Collaboration, reviews, system settings
3. `add_features.sql` — Chapter management, per-novel AI config
4. `add_minor_characters.sql` — Supporting character profiles
5. `add_writing_style.sql` — Writing style presets
6. `add_rag_chunk.sql` — Chunked text for RAG retrieval
7. `add_indexes.sql` — Composite indexes
8. `add_admin_columns.sql` — Admin roles, sensitive words, devices, invite codes

## Getting Started

### Prerequisites / 环境要求

| Dependency | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.x | 20.x LTS recommended 推荐 |
| MySQL | ≥ 8.0 | MariaDB 10.5+ compatible 兼容 |
| Redis | ≥ 6.0 | Optional 可选; AI response cache |
| npm | ≥ 9.x | Bundled with Node.js |

### Step 1 — Clone / 克隆项目

```bash
git clone https://github.com/zh2335897181-cell/ai-novel-generator.git
cd ai-novel-generator
```

### Step 2 — Database / 初始化数据库

```bash
mysql -u root -p < database/schema.sql

# Apply incremental migrations / 依次执行增量迁移:
for f in add_tables add_features add_minor_characters add_writing_style add_rag_chunk add_indexes add_admin_columns; do
  mysql -u root -p ai_novel_db < "database/${f}.sql"
done
```

> Base schema includes test account / 基础表含测试账号: `test` / `test`.

### Step 3 — Backend / 启动后端

```bash
cd backend
npm install
cp .env.example .env   # Edit with your credentials / 编辑填入你的配置
npm run dev             # → http://localhost:3000
```

### Step 4 — Frontend / 启动前端

```bash
cd frontend
npm install
npm run dev             # → http://localhost:5173
```

Vite proxies `/api` → `http://localhost:3000` in development.

### Step 5 — Docker (Alternative / 可选)

```bash
cd docker
docker-compose up -d
```

## Configuration Reference

### Environment Variables / 环境变量

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment 运行环境 |
| `PORT` | No | `8080` | HTTP listen port 监听端口 |
| `DB_HOST` | Yes | `localhost` | MySQL host 主机地址 |
| `DB_PORT` | No | `3306` | MySQL port 端口 |
| `DB_USER` | Yes | `root` | MySQL user 用户名 |
| `DB_PASSWORD` | Yes | — | MySQL password 密码 |
| `DB_NAME` | Yes | `ai_novel_db` | Database name 数据库名 |
| `REDIS_URL` | No | — | Redis connection; cache disabled when absent |
| `JWT_SECRET` | Yes | — | HS256 signing key (≥32 chars in prod) |
| `ADMIN_KEY` | No | — | Bootstrap key for initial admin setup 初始管理员密钥 |
| `AI_API_KEY` | Yes | — | LLM provider API key AI 密钥 |
| `AI_BASE_URL` | Yes | `https://api.deepseek.com/v1` | LLM endpoint (OpenAI-compatible) |
| `AI_MODEL` | Yes | `deepseek-chat` | Model identifier 模型名称 |
| `ALLOWED_ORIGINS` | No | — | Production CORS whitelist (CSV) |

### `.env` Template / 模板

```ini
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ai_novel_db

REDIS_URL=

JWT_SECRET=
ADMIN_KEY=

AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

ALLOWED_ORIGINS=
```

## API Reference

All endpoints prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`. Admin routes additionally accept `X-Admin-Key: <key>`.

> 所有接口以 `/api` 为前缀。需认证接口携带 `Authorization: Bearer <token>`。管理接口额外支持 `X-Admin-Key: <key>`。

### Authentication / 认证

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account 注册（可选邀请码） |
| `POST` | `/auth/login` | — | Authenticate, receive JWT 登录 |
| `GET` | `/auth/me` | JWT | Current user profile 当前用户信息 |

### Novels / 小说

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels` | JWT/Guest | Create novel 创建小说 |
| `GET` | `/novels` | JWT/Guest | List user's novels 小说列表 |
| `GET` | `/novels/:id` | JWT/Guest | Detail with characters, world, content 详情 |
| `DELETE` | `/novels/:id` | JWT | Delete novel (cascade) 删除 |
| `POST` | `/novels/:id/publish` | JWT | Publish to bookshelf 发布 |
| `POST` | `/novels/:id/unpublish` | JWT | Retract publication 取消发布 |

### AI Generation / AI 生成

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels/generate` | JWT/Guest | Generate content (batch) 批量生成 |
| `POST` | `/novels/generate-stream` | JWT/Guest | Generate content (SSE) 流式生成 |
| `POST` | `/novels/parse-outline` | JWT/Guest | Structure free-text outline 解析大纲 |
| `POST` | `/novels/chapter-outlines` | JWT/Guest | Chapter-level outlines 章节大纲 |
| `POST` | `/novels/toc` | JWT/Guest | Table of contents 目录生成 |
| `POST` | `/novels/plot-suggestions` | JWT/Guest | Narrative branches 情节建议 |
| `POST` | `/novels/:id/dialogue` | JWT/Guest | Character dialogue 角色对话 |

### Characters & World / 角色与世界

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels/characters` | JWT/Guest | Upsert character 添加/更新角色 |
| `GET` | `/novels/:id/characters` | JWT/Guest | List characters 角色列表 |
| `PUT` | `/novels/world` | JWT/Guest | Update world state 更新世界观 |

### Collaboration / 协作

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/collaborators` | JWT | List collaborators 协作者列表 |
| `POST` | `/novels/:id/collaborators` | JWT | Add collaborator 添加协作者 |
| `PUT` | `/novels/:id/collaborators/:userId` | JWT | Update permission 修改权限 |
| `DELETE` | `/novels/:id/collaborators/:userId` | JWT | Remove collaborator 移除协作者 |

### Reviews & Public / 审核与公开

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/reviews` | JWT | Review history 审核记录 |
| `POST` | `/novels/:id/resubmit-review` | JWT | Resubmit after revision 重新提交 |
| `GET` | `/public/bookshelf` | — | Published novels 公开书架 |
| `GET` | `/public/novels/:id` | — | Read-only view 公开阅读 |

### AI Chat / AI 对话

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/chat` | JWT | General chat (batch) 通用对话 |
| `POST` | `/ai/chat-stream` | JWT | General chat (SSE) 流式对话 |

### Timeline / 时间线

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/timeline` | JWT | List events 事件列表 |
| `POST` | `/novels/:id/timeline` | JWT | Create event 创建事件 |
| `PUT` | `/timeline/:eventId` | JWT | Update event 更新事件 |
| `DELETE` | `/timeline/:eventId` | JWT | Delete event 删除事件 |

### Admin / 管理后台

**Guard:** JWT with role `admin`/`super_admin` OR valid `X-Admin-Key` header.

#### Dashboard & Init
| Method | Path | Description |
|---|---|---|
| `POST` | `/admin/init` | Bootstrap database tables 初始化表结构 |
| `GET` | `/admin/dashboard` | Aggregate site metrics 仪表盘统计 |

#### Users / 用户管理
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | Paginated user list 用户列表 |
| `PUT` | `/admin/users/:userId/status` | Set status 状态管理 |
| `PUT` | `/admin/users/:userId/role` | Set role 角色管理 |
| `DELETE` | `/admin/users/:userId` | Delete user 删除用户 |

#### Sub-Admins / 次管理员
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/sub-admins` | List sub-admins 列表 |
| `POST` | `/admin/sub-admins` | Create sub-admin 创建 |
| `DELETE` | `/admin/sub-admins/:userId` | Revoke 撤销 |

#### Reviews & Reports / 审核与举报
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/reviews` | Review queue 审核队列 |
| `POST` | `/admin/reviews` | Submit for review 提交审核 |
| `PUT` | `/admin/reviews/:reviewId` | Adjudicate 审核裁定 |
| `POST` | `/admin/reviews/:reviewId/ai-check` | AI screening AI 辅助 |
| `GET` | `/admin/reports` | Report list 举报列表 |
| `POST` | `/admin/reports` | File report 提交举报 |
| `PUT` | `/admin/reports/:reportId` | Resolve 处理举报 |

#### Novels (Admin) / 小说管理
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/novels` | All novels 全部小说 |
| `GET` | `/admin/novels/:novelId` | Novel detail 小说详情 |
| `PUT` | `/admin/novels/:novelId/status` | Set status 状态管理 |
| `DELETE` | `/admin/novels/:novelId` | Delete novel 删除 |

#### Sensitive Words / 敏感词
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/sensitive-words` | Word list 列表 |
| `POST` | `/admin/sensitive-words` | Add word 添加 |
| `POST` | `/admin/sensitive-words/batch` | Batch import 批量导入 |
| `PUT` | `/admin/sensitive-words/:wordId` | Update 更新 |
| `DELETE` | `/admin/sensitive-words/:wordId` | Delete 删除 |
| `POST` | `/admin/sensitive-words/test` | Match test 测试匹配 |

#### System / 系统管理
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/logs` | Audit log 操作日志 |
| `GET` | `/admin/settings` | System config 系统配置 |
| `PUT` | `/admin/settings` | Update config 更新配置 |
| `GET` | `/admin/devices` | Trusted devices 受信任设备 |
| `DELETE` | `/admin/devices/:deviceId` | Revoke device 撤销设备 |
| `GET` | `/admin/invite-codes` | Invite codes 邀请码 |
| `POST` | `/admin/invite-codes` | Generate codes 生成 |
| `PUT` | `/admin/invite-codes/:codeId` | Update code 更新 |
| `DELETE` | `/admin/invite-codes/:codeId` | Delete code 删除 |

### Testing / 测试

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/tests/run` | — | Full test suite 全量测试 |
| `POST` | `/tests/run-validation` | — | Validation suite 验证测试 |

## Security Model

| Concern 安全项 | Implementation 实现方案 |
|---|---|
| Password storage 密码存储 | bcrypt with per-password salt 加盐哈希 |
| Session 会话管理 | JWT HS256 with configurable expiry |
| Rate limiting 速率限制 | IP-based token bucket (100 req/min) |
| HTTP headers 安全头 | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |
| CSRF 跨站伪造 | Origin/Referer validation on mutating requests |
| CORS 跨域 | Wildcard (dev); strict allowlist (prod) |
| Admin access 管理员 | Dual-channel: JWT role + `ADMIN_KEY` header |
| Guest isolation 游客隔离 | Ephemeral accounts, IP-locked, 10-min TTL |
| Device trust 设备信任 | Fingerprint tracking with remote revocation |
| Content filtering 内容过滤 | Configurable sensitive word dictionary, real-time scan |
| SQL injection 注入防护 | Parameterized queries via `mysql2` |
| Registration 注册控制 | Optional invite-code gating |

## Development

### Layering Convention / 分层约定

```
Controller  — HTTP: parse request, validate, format response  处理请求、校验、格式化响应
Service     — Business: orchestration, rules, cross-cutting   业务编排、规则、横切逻辑
Repository  — Data: parameterized SQL, result mapping          参数化查询、结果映射
Util        — Stateless pure functions                         无状态纯函数
```

### Running Locally / 本地运行

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### Testing / 测试

| Scope | Tool | Commands |
|---|---|---|
| Backend unit 后端 | Jest | `npm test`, `npm run test:watch`, `npm run test:coverage` |
| Frontend unit 前端 | Vitest | `npm test`, `npm run test:ui`, `npm run test:coverage` |
| E2E 端到端 | Playwright | `npm run test:e2e`, `npm run test:e2e:ui` |

### Database Migrations / 数据库迁移

Schema changes use incremental SQL files (no ORM). To migrate:

1. Create `database/<description>.sql`
2. Apply: `mysql -u root -p ai_novel_db < database/<description>.sql`
3. Or via script: `node backend/migrate_phase2.js`

### Code Style / 代码风格

- **Backend:** ES modules (`"type": "module"`), async/await
- **Frontend:** Vue 3 Composition API, `<script setup>`
- **API:** Centralized Axios instance in `frontend/src/api/novel.js` with auth interceptors
- **Secrets:** `.env` only, excluded via `.gitignore`

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full production deployment guide.

> 完整生产部署指南详见 [DEPLOY.md](./DEPLOY.md)。

**Covered topics / 涵盖内容：**
- Ubuntu 22.04 LTS environment setup 环境搭建
- MySQL installation & hardening 安装与加固
- Nginx reverse proxy + static assets 反向代理 + 静态资源
- PM2 process management with auto-restart 进程守护
- Let's Encrypt SSL/TLS 证书配置
- UFW firewall 防火墙
- Troubleshooting 故障排查

### Pre-Flight Checklist / 部署检查清单

- [ ] MySQL running, schema applied 数据库已启动，表结构已导入
- [ ] `.env` populated with production credentials 环境变量已配置
- [ ] `JWT_SECRET` ≥ 32 random characters 密钥已设置
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` set to production domain(s) CORS 已配置
- [ ] Frontend built: `npm run build` 前端已构建
- [ ] Nginx configured: `nginx -t` 已测试
- [ ] PM2 running: `pm2 status` 已启动
- [ ] Firewall: 80/443 open 防火墙已开放
- [ ] TLS certificate provisioned 证书已配置

## License

MIT License — see [LICENSE](LICENSE) for full text.
