# AI Novel Generator - AI 小说生成器

基于 AI 的智能小说创作平台，支持多角色协作、流式生成、世界观管理、时间线编辑等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + Vite + Element Plus + Pinia + ECharts |
| **后端** | Express + MySQL + JWT + Redis |
| **AI** | DeepSeek API（兼容 OpenAI 格式） |
| **测试** | Jest + Vitest + Playwright + Supertest |
| **部署** | PM2 + Nginx + Docker |

## 功能特性

### 核心功能
- **AI 小说生成** — 支持大纲解析、章节大纲生成、目录生成、情节建议
- **流式生成** — SSE 实时流式输出，边生成边阅读
- **角色管理** — 多角色创建、关系图谱可视化、角色成长图表
- **世界观管理** — 世界观设定与编辑
- **时间线管理** — 事件时间线创建、编辑、排序
- **角色对话** — AI 驱动的角色间对话生成
- **RAG 增强** — 基于上下文的检索增强生成

### 协作与发布
- **多人协作** — 邀请协作者，权限管理
- **小说发布** — 公开/私有发布，生成分享链接
- **书架展示** — 公开书架浏览已发布作品
- **公开阅读** — 无需登录即可阅读公开小说
- **内容审核** — 审核状态追踪与重新提交

### 管理系统
- **管理后台** — 仪表盘、系统概览
- **敏感词管理** — 敏感词库维护
- **审核管理** — 审核队列处理
- **用户管理** — 用户列表与角色管理

### 用户体验
- **响应式设计** — 桌面端 + 移动端适配
- **骨架屏** — 加载状态骨架屏动画
- **主题切换** — 明暗主题切换
- **命令面板** — 快捷键快速导航
- **导出功能** — 支持导出 DOCX / PDF
- **打印样式** — 专用打印 CSS
- **Cookie 同意** — GDPR 合规弹窗

### 合规页面
- 隐私政策（/privacy）
- 服务条款（/terms）

## 项目结构

```
├── backend/
│   └── src/
│       ├── config/          # 数据库配置
│       ├── controllers/     # 控制器 (auth, novel, admin, timeline)
│       ├── entity/          # 数据实体
│       ├── repositories/    # 数据访问层
│       ├── routes/          # 路由 (index, admin)
│       ├── services/        # 业务服务 (novel, character, world, RAG, cache, sensitiveWord)
│       └── utils/           # 工具 (aiClient, flowControl, functionCalling, hallucinationCollector, testRunner)
├── frontend/
│   └── src/
│       ├── api/             # API 请求封装
│       ├── components/      # 公共组件 (layout, common, skeleton)
│       ├── router/          # 路由配置
│       ├── stores/          # Pinia 状态管理
│       └── views/           # 页面视图
├── database/                # SQL 迁移脚本
├── docker/                  # Docker 配置
└── docs/                    # 文档
```

## 快速开始

### 前置要求
- Node.js 18+
- MySQL 8.0+
- Redis（可选，用于缓存）

### 1. 克隆项目

```bash
git clone https://github.com/zh2335897181-cell/ai-novel-generator.git
cd ai-novel-generator
```

### 2. 配置数据库

```bash
mysql -u root -p < database/schema.sql
```

### 3. 配置后端

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入数据库密码、AI API Key 等信息
npm install
npm run dev          # 开发模式，默认 http://localhost:3000
```

环境变量说明：

| 变量 | 说明 | 示例 |
|------|------|------|
| `DB_HOST` | 数据库地址 | `localhost` |
| `DB_USER` | 数据库用户 | `root` |
| `DB_PASSWORD` | 数据库密码 | `your_password` |
| `DB_NAME` | 数据库名 | `novel_generator` |
| `AI_API_KEY` | AI API 密钥 | `sk-xxx` |
| `AI_BASE_URL` | AI API 地址 | `https://api.deepseek.com/v1` |
| `AI_MODEL` | AI 模型 | `deepseek-chat` |
| `JWT_SECRET` | JWT 签名密钥 | `随机字符串` |
| `ADMIN_KEY` | 管理员密钥 | `随机字符串` |

### 4. 配置前端

```bash
cd frontend
npm install
npm run dev          # 开发模式，默认 http://localhost:5173
```

### 5. 访问

打开浏览器访问 `http://localhost:5173`，注册账号后即可使用。

## API 概览

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |

### 小说
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/novels` | 创建小说 |
| GET | `/api/novels` | 小说列表 |
| GET | `/api/novels/:id` | 小说详情 |
| DELETE | `/api/novels/:id` | 删除小说 |
| POST | `/api/novels/generate` | AI 生成内容 |
| POST | `/api/novels/generate-stream` | 流式 AI 生成 |
| POST | `/api/novels/parse-outline` | 解析大纲 |
| POST | `/api/novels/chapter-outlines` | 生成章节大纲 |
| POST | `/api/novels/toc` | 生成目录 |
| POST | `/api/novels/plot-suggestions` | 情节建议 |
| POST | `/api/novels/characters` | 添加角色 |
| GET | `/api/novels/:id/characters` | 获取角色列表 |
| POST | `/api/novels/:id/dialogue` | 生成角色对话 |
| PUT | `/api/novels/world` | 更新世界观 |
| POST | `/api/novels/:id/publish` | 发布小说 |
| POST | `/api/novels/:id/unpublish` | 取消发布 |

### 公开访问
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/public/bookshelf` | 公开书架 |
| GET | `/api/public/novels/:id` | 公开小说详情 |

### 协作
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/novels/:id/collaborators` | 协作者列表 |
| POST | `/api/novels/:id/collaborators` | 添加协作者 |
| PUT | `/api/novels/:id/collaborators/:userId` | 修改权限 |
| DELETE | `/api/novels/:id/collaborators/:userId` | 移除协作者 |

### AI 聊天
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/chat` | AI 对话 |
| POST | `/api/ai/chat-stream` | AI 流式对话 |

### 时间线
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/novels/:id/timeline` | 获取时间线 |
| POST | `/api/novels/:id/timeline` | 创建事件 |
| PUT | `/api/timeline/:eventId` | 更新事件 |
| DELETE | `/api/timeline/:eventId` | 删除事件 |

### 管理员
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/dashboard` | 仪表盘 |
| GET | `/api/admin/users` | 用户列表 |
| GET | `/api/admin/reviews` | 审核队列 |
| POST | `/api/admin/reviews/:id/approve` | 审核通过 |
| POST | `/api/admin/reviews/:id/reject` | 审核拒绝 |
| GET | `/api/admin/sensitive-words` | 敏感词列表 |
| POST | `/api/admin/sensitive-words` | 添加敏感词 |
| DELETE | `/api/admin/sensitive-words/:id` | 删除敏感词 |

## 命令面板

按 `Ctrl+K` 打开命令面板，支持快速导航和功能搜索。

## 测试

```bash
# 后端测试
cd backend && npm test

# 前端单元测试
cd frontend && npm test

# E2E 测试
cd frontend && npm run test:e2e
```

## 部署

详见 [DEPLOY.md](./DEPLOY.md)，包含完整的阿里云服务器部署指南。

## License

MIT
