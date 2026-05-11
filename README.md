<p align="center">
  <h1 align="center">NovelForge</h1>
  <p align="center">AI-Assisted Long-Form Fiction Authoring Platform</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0-brightgreen" alt="Node">
  <img src="https://img.shields.io/badge/vue-3.x-4fc08d" alt="Vue">
  <img src="https://img.shields.io/badge/express-4.x-000000" alt="Express">
  <img src="https://img.shields.io/badge/mysql-8.0-4479A1" alt="MySQL">
</p>

---

## Table of Contents

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

**Key design principles:**

- **Structured state management** — Characters, items, locations, and world rules are modeled as structured entities, not free-text, enabling consistent AI generation across long contexts.
- **Streaming-first generation** — All AI content is delivered via Server-Sent Events for real-time feedback during the writing process.
- **Retrieval-Augmented Generation (RAG)** — Relevant narrative context is retrieved and injected into prompts to maintain continuity across chapters.
- **Separation of concerns** — Controller → Service → Repository layering with clear boundaries between HTTP handling, business logic, and data access.

## Architecture

```
Request  →  Middleware Chain  →  Router  →  Controller  →  Service  →  Repository  →  MySQL
              │                                                              │
              ├─ CORS                                                        ├─ Redis (cache)
              ├─ Security Headers                                            └─ LLM API
              ├─ Rate Limiter                                                    │
              ├─ API Key Auth / JWT                                          DeepSeek
              └─ Admin Auth                                                  (OpenAI-compatible)
```

**Authentication flow:**

```
                    ┌──────────┐
                    │  Request │
                    └────┬─────┘
                         │
              ┌──────────▼──────────┐
              │ Public route match?  │── Yes ──▶ Pass through
              └──────────┬──────────┘
                         │ No
              ┌──────────▼──────────┐
              │ Bearer token valid? │── Yes ──▶ JWT session
              └──────────┬──────────┘
                         │ No
              ┌──────────▼──────────┐
              │ Guest mode header?  │── Yes ──▶ Temp account (10 min TTL)
              └──────────┬──────────┘
                         │ No
                         ▼
                    401 Unauthorized
```

**Generation pipeline:**

```
Plaintext Outline  →  parse-outline  →  Structured Outline
                                          │
                          ┌───────────────┼───────────────┐
                          ▼               ▼               ▼
                   chapter-outlines    toc         plot-suggestions
                          │
                          ▼
                   generate / generate-stream  (SSE)
                          │
                          ├─ RAG context retrieval
                          ├─ Character state injection
                          ├─ World rule enforcement
                          └─ Streaming token output
```

**Frontend component hierarchy:**

```
App
├─ Landing (public)
├─ Login / Register
├─ NovelList
│   └─ NovelCard[]
├─ NovelDetail (main editor)
│   ├─ AI Config Panel
│   ├─ Character Manager
│   │   ├─ Character Form
│   │   └─ Relationship Visualization (ECharts force graph)
│   ├─ World Builder
│   ├─ Timeline Manager
│   ├─ Chapter Editor
│   │   └─ SSE Stream Receiver
│   └─ Export (DOCX / PDF)
├─ BookShelf (public)
├─ PublicRead
└─ Admin Dashboard
    ├─ User Management
    ├─ Review Queue
    ├─ Sensitive Word Library
    ├─ Invite Code Manager
    └─ System Settings
```

## Core Capabilities

### Narrative Generation

| Capability | Endpoint | Description |
|---|---|---|
| Outline parsing | `parse-outline` | Converts free-text outline into structured chapter plans via function calling |
| Chapter outlining | `chapter-outlines` | Generates detailed per-chapter outlines with scene breakdowns |
| Table of contents | `toc` | Produces hierarchical chapter structure with word-count estimates |
| Plot suggestions | `plot-suggestions` | Context-aware narrative branching suggestions |
| Content generation | `generate` / `generate-stream` | Full paragraph/chapter generation with SSE streaming |
| Dialogue synthesis | `:id/dialogue` | Multi-character dialogue generation with persona consistency |

### Entity Management

- **Characters** — Structured attributes (level, status, equipment), JSON extensibility, cross-novel uniqueness constraints
- **Relationships** — Force-directed graph visualization via ECharts, relationship type labeling
- **World state** — Rules engine, background lore, extensible property system (magic, technology tier)
- **Items & Locations** — State-tracked inventory and geography with ownership/status lifecycle
- **Timeline** — Chronological event sequencing with character/chapter cross-referencing

### Collaboration & Publishing

- Role-based collaborator permissions (viewer / editor / manager)
- One-click publish/unpublish with public share links
- Public bookshelf with search and filtering
- Anonymous read-only access for published works
- Content review submission → AI-assisted audit → manual adjudication → revision feedback loop

### Administration

- **Dashboard** — Aggregate metrics: user registrations, novel count, review queue depth
- **User management** — Role assignment (super_admin / admin / user), status control, deletion
- **Sub-admin delegation** — Granular admin privilege creation and revocation
- **Review queue** — Inline content inspection, approve/reject with rationale, AI-assisted pre-screening
- **Report handling** — User-reported content triage and resolution
- **Sensitive word library** — CRUD with batch import, real-time match testing
- **Invite codes** — Registration gating with expiration policy
- **Device management** — Trusted device tracking, remote session revocation
- **Audit log** — Immutable admin action record

### User Experience

- Responsive layout: sidebar + workspace (desktop), bottom tab bar (mobile)
- Skeleton screen placeholders during async loads
- Dark/light theme with system preference detection
- Command palette (`Ctrl+K`) for keyboard-driven navigation
- GDPR Cookie consent banner
- In-app feedback collection
- Guest mode: 10-minute trial with data import to permanent account on sign-up

## Project Structure

```
novelforge/
├── backend/
│   ├── src/
│   │   ├── index.js                    # Express bootstrap, middleware, lifecycle
│   │   ├── config/database.js          # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js       # Registration, login, session
│   │   │   ├── novelController.js      # CRUD, generation, characters, world
│   │   │   ├── adminController.js      # Dashboard, users, reviews, config
│   │   │   └── timelineController.js   # Event CRUD
│   │   ├── routes/
│   │   │   ├── index.js                # Public + authenticated endpoints
│   │   │   └── admin.js                # Admin-only endpoints (adminAuth guard)
│   │   ├── services/
│   │   │   ├── novelService.js         # Core generation & publishing logic
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
│   │       ├── functionCalling.js       # Tool-use schema definitions
│   │       ├── hallucinationCollector.js # Consistency validation
│   │       └── testRunner.js           # Automated validation suite
│   ├── generate-hash.js                # bcrypt hash utility
│   └── migrate_phase2.js               # Schema migration runner
├── frontend/
│   └── src/
│       ├── main.js                     # App entry
│       ├── api/
│       │   ├── novel.js                # Axios instance, interceptors, token injection
│       │   └── admin.js                # Admin API client
│       ├── router/index.js             # Route map + beforeEach guard
│       ├── stores/user.js              # Pinia: auth, guest, unlock state
│       ├── components/
│       │   ├── layout/                 # Shell components
│       │   ├── common/                 # Shared utilities
│       │   ├── skeleton/               # Loading placeholders
│       │   ├── RelationshipVisualization.vue
│       │   ├── CharacterGrowthChart.vue
│       │   ├── TimelineManager.vue
│       │   ├── AIConfigDialog.vue
│       │   ├── CommandPalette.vue
│       │   ├── CookieConsent.vue
│       │   ├── FeedbackDialog.vue
│       │   └── UsageGuideDialog.vue
│       └── views/
│           ├── Landing.vue
│           ├── Login.vue
│           ├── NovelList.vue
│           ├── NovelDetail.vue         # Primary editor (~3200 LOC)
│           ├── AIConfig.vue
│           ├── BookShelf.vue
│           ├── PublicRead.vue
│           ├── Admin.vue               # Admin panel (~1800 LOC)
│           ├── PrivacyPolicy.vue
│           ├── TermsOfService.vue
│           └── MobileTest.vue
├── database/                           # Incremental SQL migrations
│   ├── schema.sql                      # Core tables
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

### Core Domain Tables

| Table | Purpose | Notable Constraints |
|---|---|---|
| `user` | Account registry | UNIQUE username, bcrypt password |
| `novel` | Novel metadata | FK → user, is_published flag |
| `story_content` | Generated prose | FK → novel, word_count counter |
| `story_summary` | Current plot synopsis | UNIQUE per novel |
| `world_state` | World rules & background | UNIQUE per novel, JSON extra |
| `character_state` | Character definitions | UNIQUE (novel_id, name), JSON attributes |
| `item_state` | In-world items | UNIQUE (novel_id, name), owner tracking |
| `location_state` | Geography & locations | UNIQUE (novel_id, name), typed |
| `timeline_events` | Chronological events | FK → novel, importance 1-5, related_characters JSON |

### Extension Tables (Migration Order)

1. `schema.sql` — Foundation: users, novels, world, characters, items, locations, timeline
2. `add_tables.sql` — Collaboration members, content reviews, system settings
3. `add_features.sql` — Chapter management, per-novel AI configuration
4. `add_minor_characters.sql` — Supporting character profiles
5. `add_writing_style.sql` — Writing style presets
6. `add_rag_chunk.sql` — Chunked text storage for RAG retrieval
7. `add_indexes.sql` — Composite indexes for query optimization
8. `add_admin_columns.sql` — Admin roles, sensitive words, device trust, invite codes

## Getting Started

### Prerequisites

| Dependency | Minimum Version | Notes |
|---|---|---|
| Node.js | 18.x | 20.x LTS recommended |
| MySQL | 8.0 | MariaDB 10.5+ compatible |
| Redis | 6.0 | Optional; AI response cache |
| npm | 9.x | Bundled with Node.js |

### Step 1 — Clone

```bash
git clone https://github.com/zh2335897181-cell/ai-novel-generator.git
cd ai-novel-generator
```

### Step 2 — Database

```bash
mysql -u root -p < database/schema.sql

# Apply incremental migrations in order:
for f in add_tables add_features add_minor_characters add_writing_style add_rag_chunk add_indexes add_admin_columns; do
  mysql -u root -p ai_novel_db < "database/${f}.sql"
done
```

The base schema includes a test account: username `test`, password `test`.

### Step 3 — Backend

```bash
cd backend
npm install

cp .env.example .env   # or create manually
npm run dev             # http://localhost:3000
```

### Step 4 — Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Vite proxies `/api` requests to `http://localhost:3000` in development mode.

### Step 5 — Docker (Alternative)

```bash
cd docker
docker-compose up -d
```

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `8080` | HTTP listen port |
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | Yes | `root` | MySQL user |
| `DB_PASSWORD` | Yes | — | MySQL password |
| `DB_NAME` | Yes | `ai_novel_db` | Database name |
| `REDIS_URL` | No | — | Redis connection string; cache disabled when absent |
| `JWT_SECRET` | Yes | — | HS256 signing key (≥32 chars in production) |
| `ADMIN_KEY` | No | — | Bootstrap key for initial admin setup |
| `AI_API_KEY` | Yes | — | LLM provider API key |
| `AI_BASE_URL` | Yes | `https://api.deepseek.com/v1` | LLM endpoint (OpenAI-compatible) |
| `AI_MODEL` | Yes | `deepseek-chat` | Model identifier |
| `ALLOWED_ORIGINS` | No | — | Production CORS whitelist (comma-separated) |

### `.env` Template

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

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`. Admin routes additionally accept `X-Admin-Key: <key>`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account (invite code optional) |
| `POST` | `/auth/login` | — | Authenticate, receive JWT |
| `GET` | `/auth/me` | JWT | Current user profile & permissions |

### Novels

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels` | JWT/Guest | Create novel |
| `GET` | `/novels` | JWT/Guest | List user's novels |
| `GET` | `/novels/:id` | JWT/Guest | Novel with characters, world, content |
| `DELETE` | `/novels/:id` | JWT | Delete novel (cascade) |
| `POST` | `/novels/:id/publish` | JWT | Publish to public bookshelf |
| `POST` | `/novels/:id/unpublish` | JWT | Retract publication |

### AI Generation

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels/generate` | JWT/Guest | Generate content (batch) |
| `POST` | `/novels/generate-stream` | JWT/Guest | Generate content (SSE stream) |
| `POST` | `/novels/parse-outline` | JWT/Guest | Structure free-text outline |
| `POST` | `/novels/chapter-outlines` | JWT/Guest | Generate chapter-level outlines |
| `POST` | `/novels/toc` | JWT/Guest | Generate table of contents |
| `POST` | `/novels/plot-suggestions` | JWT/Guest | Suggest narrative branches |
| `POST` | `/novels/:id/dialogue` | JWT/Guest | Generate character dialogue |

### Characters & World

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/novels/characters` | JWT/Guest | Upsert character |
| `GET` | `/novels/:id/characters` | JWT/Guest | List characters |
| `PUT`  | `/novels/world` | JWT/Guest | Update world state |

### Collaboration

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/collaborators` | JWT | List collaborators |
| `POST` | `/novels/:id/collaborators` | JWT | Add collaborator |
| `PUT` | `/novels/:id/collaborators/:userId` | JWT | Update permission |
| `DELETE` | `/novels/:id/collaborators/:userId` | JWT | Remove collaborator |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/reviews` | JWT | Get review history |
| `POST` | `/novels/:id/resubmit-review` | JWT | Resubmit after revision |

### Public

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/public/bookshelf` | — | Published novels feed |
| `GET` | `/public/novels/:id` | — | Read-only novel view |

### AI Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/chat` | JWT | General AI chat (batch) |
| `POST` | `/ai/chat-stream` | JWT | General AI chat (SSE) |

### Timeline

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/novels/:id/timeline` | JWT | List timeline events |
| `POST` | `/novels/:id/timeline` | JWT | Create event |
| `PUT` | `/timeline/:eventId` | JWT | Update event |
| `DELETE` | `/timeline/:eventId` | JWT | Delete event |

### Admin

**Guard:** All admin routes require JWT with role `admin`/`super_admin` OR valid `X-Admin-Key` header.

#### Dashboard & Init
| Method | Path | Description |
|---|---|---|
| `POST` | `/admin/init` | Bootstrap database tables |
| `GET` | `/admin/dashboard` | Aggregate site metrics |

#### Users
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | Paginated user list |
| `PUT` | `/admin/users/:userId/status` | Set user status |
| `PUT` | `/admin/users/:userId/role` | Set user role |
| `DELETE` | `/admin/users/:userId` | Delete user |

#### Sub-Admins
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/sub-admins` | List sub-admins |
| `POST` | `/admin/sub-admins` | Create sub-admin |
| `DELETE` | `/admin/sub-admins/:userId` | Revoke sub-admin |

#### Reviews
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/reviews` | Review queue |
| `POST` | `/admin/reviews` | Submit for review |
| `PUT` | `/admin/reviews/:reviewId` | Adjudicate |
| `POST` | `/admin/reviews/:reviewId/ai-check` | AI-assisted screening |

#### Reports
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/reports` | Report list |
| `POST` | `/admin/reports` | File report |
| `PUT` | `/admin/reports/:reportId` | Resolve report |

#### Novels
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/novels` | All novels |
| `GET` | `/admin/novels/:novelId` | Novel detail |
| `PUT` | `/admin/novels/:novelId/status` | Set novel status |
| `DELETE` | `/admin/novels/:novelId` | Delete novel |

#### Sensitive Words
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/sensitive-words` | Word list |
| `POST` | `/admin/sensitive-words` | Add word |
| `POST` | `/admin/sensitive-words/batch` | Batch import |
| `PUT` | `/admin/sensitive-words/:wordId` | Update word |
| `DELETE` | `/admin/sensitive-words/:wordId` | Delete word |
| `POST` | `/admin/sensitive-words/test` | Match test |

#### System
| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/logs` | Audit log |
| `GET` | `/admin/settings` | System config |
| `PUT` | `/admin/settings` | Update config |
| `GET` | `/admin/devices` | Trusted devices |
| `DELETE` | `/admin/devices/:deviceId` | Revoke device |
| `GET` | `/admin/invite-codes` | Invite code list |
| `POST` | `/admin/invite-codes` | Generate codes |
| `PUT` | `/admin/invite-codes/:codeId` | Update code |
| `DELETE` | `/admin/invite-codes/:codeId` | Delete code |

### Testing

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/tests/run` | — | Full automated test suite |
| `POST` | `/tests/run-validation` | — | Validation-only test suite |

## Security Model

| Concern | Implementation |
|---|---|
| Password storage | bcrypt with per-password salt |
| Session management | JWT HS256 with configurable expiry |
| Rate limiting | IP-based token bucket (100 req/min, in-memory) |
| HTTP headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |
| CSRF | Origin/Referer validation on state-changing methods |
| CORS | Wildcard in development; strict allowlist in production |
| Admin access | Dual-channel: JWT role claim + static `ADMIN_KEY` header |
| Guest isolation | Ephemeral user records, IP-locked, 10-minute TTL |
| Device trust | Fingerprint tracking with remote revocation |
| Content filtering | Configurable sensitive word dictionary with real-time scan |
| SQL injection | Parameterized queries via `mysql2` prepared statements |
| Registration gating | Optional invite-code requirement |

## Development

### Layering Convention

```
Controller  — HTTP concern: parse request, validate input, format response
Service     — Business concern: orchestration, rules, cross-cutting logic
Repository  — Data concern: parameterized SQL, result mapping
Util        — Stateless pure functions
```

### Running Locally

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### Testing

| Scope | Tool | Commands |
|---|---|---|
| Backend unit | Jest | `npm test`, `npm run test:watch`, `npm run test:coverage` |
| Frontend unit | Vitest | `npm test`, `npm run test:ui`, `npm run test:coverage` |
| End-to-end | Playwright | `npm run test:e2e`, `npm run test:e2e:ui` |

### Database Migrations

Schema changes are applied as incremental SQL files in `database/`. No ORM migration framework is used. To add a migration:

1. Create `database/<description>.sql`
2. Apply: `mysql -u root -p ai_novel_db < database/<description>.sql`
3. Optionally run via the migration utility: `node backend/migrate_phase2.js`

### Code Style

- Backend: ES modules (`"type": "module"`), async/await
- Frontend: Vue 3 Composition API, `<script setup>` syntax
- API requests: centralized Axios instance in `frontend/src/api/novel.js` with auth interceptors
- Secrets: `.env` only, excluded via `.gitignore`

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full production deployment instructions covering:

- Ubuntu 22.04 LTS environment setup
- MySQL installation and hardening
- Nginx reverse proxy with static asset serving
- PM2 process management with auto-restart
- Let's Encrypt SSL/TLS
- UFW firewall configuration
- Troubleshooting common issues

### Pre-Flight Checklist

- [ ] MySQL instance running, schema applied
- [ ] `.env` populated with production credentials
- [ ] `JWT_SECRET` ≥ 32 random characters
- [ ] `NODE_ENV=production`
- [ ] `ALLOWED_ORIGINS` set to production domain(s)
- [ ] Frontend built: `cd frontend && npm run build`
- [ ] Nginx configured and tested: `nginx -t`
- [ ] PM2 running: `pm2 status`
- [ ] Firewall allows 80/443
- [ ] TLS certificate provisioned

## License

MIT License — see [LICENSE](LICENSE) for full text.
