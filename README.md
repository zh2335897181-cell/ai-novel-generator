<<<<<<< HEAD
# AI小说生成系统

一个基于MySQL外部记忆的AI小说生成系统，解决AI无法记住剧情、角色状态混乱、世界设定丢失的问题。

## 技术栈

### 前端
- Vue 3 + Vite
- Element Plus
- Axios
- Pinia

### 后端
- Node.js + Express
- MySQL（关系型数据库）
- MyBatis风格的数据访问

### AI接口
- DeepSeek / OpenAI兼容接口

## 核心特性

### 1. MySQL外部记忆系统
- 结构化存储角色状态（非JSON全存）
- 支持单独更新每个角色
- 防止角色复活（死亡状态不可逆）
- 世界设定持久化

### 2. 智能状态管理
- 自动提取角色变化
- 自动更新世界设定
- 自动生成剧情摘要

### 3. 数据库设计亮点
- 核心字段结构化 + 扩展字段JSON
- 支持高扩展性
- 符合关系型数据库设计规范

## 快速开始

### 1. 数据库初始化

```bash
# 导入数据库
mysql -u root -pzh2335897 < database/schema.sql
```

### 2. 后端启动

```bash
cd backend
npm install
# 修改 .env 文件，配置AI API Key
npm run dev
```

后端运行在 http://localhost:8080

### 3. 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端运行在 http://localhost:3000

## 配置说明

### 后端配置（backend/.env）

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=zh2335897
DB_NAME=ai_novel_db

# AI配置
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

支持的AI接口：
- DeepSeek: https://api.deepseek.com/v1
- OpenAI: https://api.openai.com/v1
- 其他OpenAI兼容接口

## 数据库设计

### 表结构

1. **user** - 用户表
2. **novel** - 小说表
3. **world_state** - 世界设定表（规则、背景、扩展属性）
4. **character_state** - 角色状态表（结构化存储）
5. **story_summary** - 剧情摘要表
6. **story_content** - 内容表

### 核心设计理念

```sql
-- 角色表：核心字段结构化
CREATE TABLE character_state (
    id BIGINT PRIMARY KEY,
    novel_id BIGINT,
    name VARCHAR(100),      -- 结构化
    level INT,              -- 结构化
    status VARCHAR(20),     -- 结构化（正常/受伤/死亡）
    attributes JSON         -- 扩展字段
);
```

优势：
- 可以直接SQL查询"所有死亡角色"
- 可以单独更新某个角色的状态
- 支持复杂查询和统计

## 核心流程

### 小说生成流程

```
1. 从MySQL查询
   ├─ world_state（世界设定）
   ├─ character_state（所有角色）
   └─ story_summary（当前摘要）

2. 拼接Prompt（结构化）
   ├─ 角色列表转换为文本
   ├─ 标明死亡角色
   └─ 强约束规则

3. 调用AI生成小说

4. 保存到story_content

5. 调用AI提取摘要

6. 更新MySQL
   ├─ UPDATE character_state（单独更新）
   ├─ UPDATE world_state
   └─ UPDATE story_summary
```

## AI Prompt设计

详见 `docs/AI_PROMPT_DESIGN.md`

核心要点：
- 强约束防止角色复活
- 结构化输出便于数据库更新
- 明确标注数据来源（MySQL）

## 项目结构

```
ai-novel-generator/
├── database/
│   └── schema.sql              # 数据库结构
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # 数据库连接
│   │   ├── controllers/
│   │   │   └── novelController.js
│   │   ├── services/
│   │   │   └── novelService.js # 核心业务逻辑
│   │   ├── utils/
│   │   │   └── aiClient.js     # AI调用封装
│   │   ├── routes/
│   │   │   └── index.js
│   │   └── index.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── novel.js
│   │   ├── views/
│   │   │   ├── NovelList.vue   # 小说列表
│   │   │   └── NovelDetail.vue # 小说详情（核心页面）
│   │   ├── router/
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API接口

### 小说相关
- `POST /api/novel/create` - 创建小说
- `GET /api/novel/list` - 获取列表
- `GET /api/novel/:id` - 获取详情

### 角色相关
- `POST /api/character/add` - 添加角色
- `GET /api/character/:novelId` - 获取角色列表

### 世界设定
- `POST /api/world/update` - 更新世界设定

### 生成
- `POST /api/generate` - 生成小说（核心接口）

## 使用说明

### 1. 创建小说
点击"创建新小说"，输入标题

### 2. 设置世界
点击"编辑世界设定"，输入：
- 世界规则（例如：修仙世界，有金丹、元婴等境界）
- 世界背景（例如：天元大陆，灵气复苏）

### 3. 添加角色
点击"添加角色"，输入：
- 角色名
- 等级
- 属性（JSON格式）

### 4. 生成小说
输入剧情指令，例如：
- "让主角遇到一个神秘商人"
- "主角突破到金丹期"
- "反派角色死亡"

系统会：
1. 根据当前状态生成续写
2. 自动更新角色状态
3. 更新剧情摘要

## 核心优势

### vs 纯Prompt记忆
- ❌ Prompt：角色信息混在一段文本里
- ✅ MySQL：每个角色独立一行，可单独查询更新

### vs 全JSON存储
- ❌ JSON：`{"characters": [...]}`，无法SQL查询
- ✅ 结构化：`SELECT * FROM character_state WHERE status='死亡'`

### vs 无状态管理
- ❌ 无状态：AI可能让死人复活
- ✅ 状态管理：死亡状态写入数据库，强约束

## 测试

本项目包含完整的测试套件，包括单元测试、集成测试和E2E测试。

### 快速开始

```bash
# 安装测试依赖
./install-test-deps.bat  # Windows
./install-test-deps.sh   # Linux/Mac

# 运行所有测试
./test-all.bat          # Windows
./test-all.sh           # Linux/Mac
```

### 测试类型

- **后端单元测试**: Jest + Supertest
- **前端单元测试**: Vitest + Vue Test Utils
- **E2E测试**: Playwright
- **CI/CD**: GitHub Actions

### 详细文档

查看 [测试文档](./docs/TESTING.md) 了解更多信息。

## 扩展建议

1. 添加用户认证（JWT）
2. 支持多用户协作
3. 添加角色关系图
4. 支持导出小说
5. 添加版本回退功能

## 常见问题

### Q: AI生成的角色状态更新失败？
A: 检查AI返回的JSON格式是否正确，角色名是否存在于数据库

### Q: 如何防止角色复活？
A: 在Prompt中明确标注死亡角色，AI提取时验证状态变化合理性

### Q: 数据库密码如何修改？
A: 修改 `backend/.env` 中的 `DB_PASSWORD`

## 许可证

MIT
=======
# ai-novel-generator
>>>>>>> origin/main
