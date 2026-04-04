/**
 * AI Prompt 构建工具
 * 从后端 aiClient.js 迁移至前端
 */

export function buildStoryPrompt(worldState, characters, summary, userInput, items = [], locations = [], minorCharacters = [], wordCount = 800) {
  const characterList = characters.map(c => {
    let attrs = {}
    try {
      if (typeof c.attributes === 'string') attrs = JSON.parse(c.attributes)
      else if (c.attributes && typeof c.attributes === 'object') attrs = c.attributes
    } catch { attrs = {} }
    return `【${c.name}】等级${c.level} | 状态:${c.status} | 属性:${JSON.stringify(attrs)}`
  }).join('\n')

  const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、')
  const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、')

  const itemList = items.length > 0
    ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
    : '暂无'

  const locationList = locations.length > 0
    ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
    : '暂无'

  const minorCharacterList = minorCharacters.length > 0
    ? minorCharacters.map(m => {
        const itemsStr = m.items ? (typeof m.items === 'string' ? m.items : JSON.stringify(m.items)) : '[]'
        return `【${m.name}】角色:${m.role || '路人'} | 状态:${m.status} | 描述:${m.description || '无'} | 物品:${itemsStr}`
      }).join('\n')
    : '暂无'

  return `你是一个专业的小说续写AI。以下是完整世界状态：

======================== 世界设定 ========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '无特定风格'}
【规则】${worldState?.rules || '无'}
【背景】${worldState?.background || '无'}
【扩展】${worldState?.extra || '{}'}

⚠️ 写作风格要求：
${worldState?.style ? `必须严格按照以下风格写作：
${worldState.style}

风格要点：
- 语言风格：遵循上述风格的语言特点
- 叙事节奏：符合风格的节奏感
- 描写方式：采用风格要求的描写手法
- 对话风格：对话要符合风格特征
` : '使用通用小说风格'}

======================== 主要角色状态 ========================
${characterList}

⚠️ 存活角色：${aliveCharacters || '无'}
⚠️ 已死亡角色：${deadCharacters || '无'}

======================== 配角状态 ========================
${minorCharacterList}

⚠️ 说明：配角包括路人、炮灰、店主、守卫等次要角色

======================== 物品状态 ========================
${itemList}

======================== 地点状态 ========================
${locationList}

======================== 当前剧情摘要 ========================
${summary || '故事刚开始'}

======================== 用户指令 ========================
${userInput}

======================== 生成要求（强约束）========================
1. 严格遵守角色状态
2. 死亡角色绝对不能复活或出现
3. 角色状态变化必须合理（受伤→死亡可以，死亡→正常不行）
4. 必须使用世界规则
5. ⚠️ 严格字数限制：生成${wordCount}字（误差±50字以内）
6. 如果出现新物品或新地点，必须在内容中明确描述
7. 如果出现新的配角（炮灰、路人等），必须简单描述其特征
8. 不要输出任何JSON或元数据，只输出小说正文
9. 内容要连贯，有情节推进
10. ⚠️ 写作风格一致性：全文必须保持统一的写作风格

======================== 📌 关键点选择策略 ========================
⚠️ 重要：每次生成新章节时，必须智能挑选本章需要的关键点：

【角色选择】
- 根据剧情需要，从存活角色中选择2-4个参与本章
- 优先选择与用户指令相关的角色
- 不要每章都出现所有角色

【配角运用】
- 可以使用已有的配角，或创建新的配角
- 配角用于丰富场景，点到为止

【物品运用】
- 从物品列表中挑选与本章情节相关的物品
- 考虑物品的持有者和当前状态

【地点设定】
- 根据剧情发展，选择合适的地点作为本章场景

现在开始续写（${wordCount}字）：`
}

export function buildSummaryPrompt(storyContent, worldState, characters, items = [], locations = [], minorCharacters = []) {
  const characterList = characters.map(c => `${c.name}(${c.status})`).join('、')
  const itemList = items.map(i => `${i.name}(${i.status})`).join('、')
  const locationList = locations.map(l => `${l.name}(${l.status})`).join('、')
  const minorCharacterList = minorCharacters.map(m => `${m.name}(${m.role}-${m.status})`).join('、')

  return `你是一个数据提取AI。请分析以下小说内容，提取结构化数据。

======================== 小说内容 ========================
${storyContent}

======================== 当前主要角色列表 ========================
${characterList || '无'}

======================== 当前配角列表 ========================
${minorCharacterList || '无'}

======================== 当前物品列表 ========================
${itemList || '无'}

======================== 当前地点列表 ========================
${locationList || '无'}

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapter_title": "本章标题（简洁有吸引力，10字以内）",
  "chapter_outline": "本章大纲（100字以内，概括核心情节）",
  "character_updates": [
    {
      "name": "角色名（必须是已存在的主要角色）",
      "new_status": "正常/受伤/死亡",
      "level": 数字,
      "change": "变化描述"
    }
  ],
  "minor_character_updates": [
    {
      "name": "配角名",
      "role": "路人/炮灰/店主/守卫等",
      "status": "正常/受伤/死亡",
      "description": "简短描述（50字以内）",
      "items": ["持有的物品列表"],
      "is_new": true/false
    }
  ],
  "item_updates": [
    {
      "name": "物品名",
      "type": "物品类型",
      "owner": "持有者名字",
      "status": "存在/损毁/丢失",
      "is_new": true/false
    }
  ],
  "location_updates": [
    {
      "name": "地点名",
      "type": "地点类型",
      "status": "正常/封闭/毁灭",
      "description": "简短描述",
      "is_new": true/false
    }
  ],
  "world_updates": {
    "rules": "新增或修改的规则",
    "background": "背景更新"
  },
  "summary": "200字以内的剧情摘要"
}

⚠️ 注意：
1. chapter_title 必须简洁有吸引力
2. 只更新有变化的主要角色
3. 死亡状态不可逆
4. 不要创建新的主要角色
5. is_new=true表示新出现的配角/物品/地点
6. summary必须简洁

现在输出JSON：`
}

export function buildOutlineParsePrompt(outline) {
  return `你是一个专业的小说分析AI。请分析以下小说大纲，提取关键要素。

======================== 用户输入的小说大纲 ========================
${outline}

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "world": {
    "genre": "小说类型（玄幻/修仙/武侠/都市/科幻/魔法/历史/其他）",
    "style": "写作风格详细描述",
    "rules": "世界规则",
    "background": "世界背景",
    "realm_system": {
      "has_realm": true/false,
      "realms": ["境界1", "境界2"],
      "description": "境界体系说明"
    },
    "extra": {
      "setting": "其他设定"
    }
  },
  "characters": [
    {
      "name": "角色名",
      "level": 1,
      "realm": "境界名称（如果有境界系统）",
      "role": "主角/配角/反派",
      "attributes": {
        "性格": "描述",
        "能力": "描述",
        "背景": "描述"
      }
    }
  ],
  "summary": "100字以内的故事开端摘要"
}

⚠️ 智能境界系统规则：
1. 玄幻/修仙/武侠/魔法类型，必须设置has_realm=true并提供境界列表
2. 都市/科幻/历史类型，设置has_realm=false
3. 至少提取1个主角
4. 世界规则要具体明确
5. 确保JSON格式完全正确

现在开始分析并输出JSON：`
}

export function buildChapterOutlinePrompt(worldState, characters, summary, chapterCount, items = [], locations = []) {
  const characterList = characters.map(c => {
    const realmOrLevel = c.realm || `Lv.${c.level}`
    return `【${c.name}】${realmOrLevel} | 状态:${c.status}`
  }).join('\n')

  const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、')
  const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、')

  const itemList = items.length > 0
    ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
    : '暂无'

  const locationList = locations.length > 0
    ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status}`).join('\n')
    : '暂无'

  return `你是一个专业的小说大纲规划AI。请根据当前状态，生成接下来${chapterCount}章的章节大纲。

======================== 世界设定 ========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【规则】${worldState?.rules || '无'}
【背景】${worldState?.background || '无'}

======================== 角色状态 ========================
${characterList}
⚠️ 存活角色：${aliveCharacters || '无'}
⚠️ 已死亡角色：${deadCharacters || '无'}

======================== 物品状态 ========================
${itemList}

======================== 地点状态 ========================
${locationList}

======================== 当前剧情摘要 ========================
${summary || '故事刚开始'}

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapters": [
    {
      "chapter_number": 1,
      "title": "章节标题（简洁有吸引力）",
      "outline": "200字以内的章节大纲"
    }
  ]
}

⚠️ 注意：
1. 生成${chapterCount}章的大纲
2. 章节要有连贯性和递进关系
3. 符合小说类型和风格
4. 确保JSON格式正确

现在开始生成章节大纲：`
}

export function parseAIJSON(result) {
  try {
    let cleanResult = result.trim()
    if (cleanResult.startsWith('```json')) {
      cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanResult.startsWith('```')) {
      cleanResult = cleanResult.replace(/```\n?/g, '')
    }
    return JSON.parse(cleanResult)
  } catch (error) {
    console.error('JSON解析失败，原始内容:', result)
    return null
  }
}
