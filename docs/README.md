# AI小说生成系统

## 系统概述

智能小说生成系统，支持流式生成、章节管理、角色追踪、物品系统、地点系统和配角管理。

## 快速开始

### 1. 启动服务

```bash
# Windows
start.bat

# 手动启动
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

### 2. 访问系统

- 前端：http://localhost:3000
- 后端：http://localhost:8080

## 核心功能

### 1. 智能关键点选择

生成章节时，AI从完整状态表中智能选择相关元素：
- 角色：选择2-4个与剧情相关的存活角色
- 物品：只提及与情节相关的物品
- 地点：选择合适的场景

### 2. 章节元数据生成

- 自动生成章节标题（10字以内）
- 自动生成章节大纲（100字以内）
- 自动追踪章节号

### 3. 配角系统

配角类型：路人、炮灰、店主、守卫、信使、其他

```json
{
  "name": "张老板",
  "role": "店主",
  "status": "正常",
  "description": "天元城武器店老板",
  "items": ["铁剑x10"]
}
```

### 4. 物品系统

物品状态：存在、丢失、损毁

物品类型：武器、道具、宝物、药品、材料

### 5. 地点系统

地点状态：正常、封闭、毁灭

地点类型：城市、山脉、秘境、建筑等

## 数据库表

| 表名 | 说明 |
|-----|------|
| novel | 小说信息 |
| world_state | 世界设定 |
| character_state | 主要角色状态 |
| minor_character_state | 配角状态 |
| item_state | 物品状态 |
| location_state | 地点状态 |
| story_summary | 剧情摘要 |
| story_content | 章节内容 |
| chapter_outline | 章节大纲 |

## 状态规则

### 角色状态
- 正常 → 受伤 → 死亡（可逆）
- 死亡 → 正常/受伤（不可逆，AI不能复活死亡角色）

### 物品状态
- 存在 → 丢失/损毁（可逆）
- 丢失/损毁 → 存在（不可逆）

### 地点状态
- 正常 → 封闭/毁灭（可逆）
- 封闭/毁灭 → 正常（不可逆）

## 可配置的规则引擎

系统根据小说类型自动选择验证规则，确保不同类型小说使用不同的验证逻辑。

### 规则类型

| 小说类型 | 适用关键词 | 验证规则 |
|---------|-----------|---------|
| 通用 | 全部 | 角色状态、物品状态、地点状态 |
| 玄幻/仙侠 | 玄幻、仙侠、修真 | 境界压制、修仙者规则 |
| 都市 | 都市、现代 | 财富等级、社会地位 |
| 游戏 | 游戏、网游、虚拟现实 | 等级压制、装备等级 |
| 科幻 | 科幻、星际、未来 | 科技等级 |

### 境界系统（仅玄幻/仙侠）

境界层级（从低到高）：
凡人之躯 → 炼气期 → 筑基期 → 金丹期 → 元婴期 → 化神期 → 大乘期 → 渡劫期 → 真仙 → 金仙 → 太乙金仙 → 大罗金仙 → 混元大罗金仙

战斗规则：只能跨1-2个小境界战斗

### 都市规则

- 财富等级：财富值变化必须合理（不能从0突然买别墅）
- 社会地位：地位提升需要合理的事件驱动（家族、继承、结婚）

## AI提示词设计

### 核心原则

```
数据库存储 → 结构化Prompt → AI理解 → 结构化输出 → 数据库更新
```

### 小说生成Prompt

```
## 【绝对禁止】 ##
🚫 死亡角色绝对不能出现、不能复活
🚫 已丢失/损毁的物品不能使用
🚫 已封闭/毁灭的地点不能使用
🚫 禁止创造新角色（主角除外）

## 【写作前准备】 ##
在开始续写之前，请先确认：
- 本章将使用哪些角色？
- 本章将使用哪些物品？
- 本章将发生在哪个地点？
- 本章的核心事件是什么？
```

## 减少幻觉方案

### 1. 提示词优化
- 禁止规则前置
- 要求AI先"思考"再生成
- 明确数据库当前状态

### 2. 类型规则引擎
- 根据小说类型自动选择验证规则
- 通用规则 + 类型特定规则
- 支持扩展新的小说类型

### 3. Function Calling
使用AI的Function Calling替代JSON提取：
- extract_chapter_metadata
- update_character_status
- update_minor_character
- update_item
- update_location

### 4. 流程控制

7个阶段：
1. QUERY_STATE - 查询状态
2. GENERATE_CONTENT - 生成内容
3. EXTRACT_SUMMARY - 提取摘要
4. VALIDATE_UPDATES - 验证更新（使用RuleEngine）
5. SAVE_CONTENT - 保存内容
6. UPDATE_STATE - 更新状态
7. COMMIT - 提交事务

### 5. 回滚机制

每个环节失败时自动回滚：
```javascript
flow.addRollback(async () => {
  await conn.query('DELETE FROM story_content WHERE novel_id = ? AND chapter_number = ?', [novelId, chapterNumber]);
});
```

## 测试

```bash
# 运行验证测试
POST /api/tests/run-validation
```

## 相关文件

- `backend/src/utils/aiClient.js` - AI提示词
- `backend/src/utils/flowControl.js` - 流程控制和规则引擎
- `backend/src/utils/functionCalling.js` - Function Calling
- `backend/src/utils/hallucinationCollector.js` - 幻觉案例收集
- `backend/src/utils/testRunner.js` - 测试用例库
- `backend/src/services/novelService.js` - 业务逻辑
- `backend/src/controllers/novelController.js` - 控制器
