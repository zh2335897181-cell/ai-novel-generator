import axios from 'axios';

class AIClient {
  async chat(messages, temperature = 0.7, config) {
    // 从请求中获取配置，如果没有则使用环境变量
    const apiKey = config?.apiKey || process.env.AI_API_KEY;
    const baseURL = config?.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
    const model = config?.model || process.env.AI_MODEL || 'deepseek-chat';

    if (!apiKey) {
      throw new Error('请先配置AI API Key');
    }

    try {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI调用失败:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'AI生成失败');
    }
  }

  // 流式聊天（新增）
  async chatStream(messages, temperature = 0.7, config, onChunk) {
    const apiKey = config?.apiKey || process.env.AI_API_KEY;
    const baseURL = config?.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
    const model = config?.model || process.env.AI_MODEL || 'deepseek-chat';

    if (!apiKey) {
      throw new Error('请先配置AI API Key');
    }

    try {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: 2000,
          stream: true
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      let fullContent = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.includes('[DONE]')) continue;
            if (!line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        });

        response.data.on('end', () => {
          resolve(fullContent);
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('AI流式调用失败:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'AI生成失败');
    }
  }

  // 生成小说内容
  async generateStory(worldState, characters, summary, userInput, config, wordCount = 800) {
    const prompt = this.buildStoryPrompt(worldState, characters, summary, userInput, [], [], wordCount);
    return await this.chat([{ role: 'user', content: prompt }], 0.8, config);
  }

  // 生成小说内容（流式）；ragContext 为检索增强片段，可为空
  async generateStoryStream(worldState, characters, summary, userInput, config, items, locations, minorCharacters, wordCount, onChunk, ragContext = '', previousChapterContent = '', timelineEvents = []) {
    const prompt = this.buildStoryPrompt(worldState, characters, summary, userInput, items, locations, minorCharacters, wordCount, ragContext, previousChapterContent, timelineEvents);
    return await this.chatStream([{ role: 'user', content: prompt }], 0.8, config, onChunk);
  }

  // 提取摘要和更新
  async extractSummary(storyContent, worldState, characters, items, locations, minorCharacters, config) {
    const prompt = this.buildSummaryPrompt(storyContent, worldState, characters, items, locations, minorCharacters);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.3, config);
    
    try {
      // 尝试清理可能的markdown代码块
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/```\n?/g, '');
      }
      
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('JSON解析失败，原始内容:', result);
      // 返回默认结构
      return {
        chapter_title: '未命名章节',
        chapter_outline: storyContent.substring(0, 200),
        character_updates: [],
        minor_character_updates: [],
        item_updates: [],
        location_updates: [],
        world_updates: {},
        summary: storyContent.substring(0, 200)
      };
    }
  }

  // 拆解小说大纲（新功能）
  async parseNovelOutline(outline, config) {
    const prompt = this.buildOutlineParsePrompt(outline);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.5, config);
    
    try {
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/```\n?/g, '');
      }
      
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('大纲解析失败，原始内容:', result);
      throw new Error('AI解析失败，请重试');
    }
  }

  // 生成章节大纲（新功能）
  async generateChapterOutlines(worldState, characters, summary, chapterCount, items, locations, config) {
    const prompt = this.buildChapterOutlinePrompt(worldState, characters, summary, chapterCount, items, locations);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config);
    
    try {
      let cleanResult = result.trim();
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/```\n?/g, '');
      }
      
      return JSON.parse(cleanResult);
    } catch (error) {
      console.error('章节大纲生成失败，原始内容:', result);
      throw new Error('AI生成失败，请重试');
    }
  }

  // 构建小说生成Prompt
  buildStoryPrompt(worldState, characters, summary, userInput, items = [], locations = [], minorCharacters = [], wordCount = 800, ragContext = '', previousChapterContent = '', timelineEvents = []) {
    const characterList = characters.map(c => {
      let attrs = {};
      try {
        if (typeof c.attributes === 'string') {
          attrs = JSON.parse(c.attributes);
        } else if (c.attributes && typeof c.attributes === 'object') {
          attrs = c.attributes;
        }
      } catch (e) {
        attrs = {};
      }
      const realmInfo = c.realm ? `境界:${c.realm}` : `等级:Lv.${c.level}`;
      return `【${c.name}】${realmInfo} | 状态:${c.status}`;
    }).join('\n');

    const aliveCharacters = characters.filter(c => c.status !== '死亡');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name);

    const aliveList = aliveCharacters.map(c => c.name).join('、');
    const deadList = deadCharacters.join('、');

    const aliveCharacterDetails = aliveCharacters.map(c => {
      const realmInfo = c.realm ? `境界:${c.realm}` : `等级:Lv.${c.level}`;
      return `【${c.name}】${realmInfo}`;
    }).join('\n');

    const itemList = items.length > 0
      ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无主'} | 状态:${i.status}`).join('\n')
      : '暂无';

    const locationList = locations.length > 0
      ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
      : '暂无';

    const minorCharacterList = minorCharacters.length > 0
      ? minorCharacters.map(m => {
          const itemsStr = m.items ? (typeof m.items === 'string' ? m.items : JSON.stringify(m.items)) : '[]';
          return `【${m.name}】角色:${m.role || '路人'} | 状态:${m.status}`;
        }).join('\n')
      : '暂无';

    const closedLocations = locations.filter(l => l.status === '封闭' || l.status === '毁灭').map(l => l.name);
    const lostItems = items.filter(i => i.status === '丢失' || i.status === '损毁').map(i => i.name);

    // 构建时间线上下文
    const timelineContext = timelineEvents && timelineEvents.length > 0
      ? timelineEvents.map(e => {
          const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString() : '时间未定';
          const chapterStr = e.related_chapter ? `(第${e.related_chapter}章)` : '';
          return `- ${dateStr} ${chapterStr} 【${e.type}】${e.title}: ${e.description || '无描述'}`;
        }).join('\n')
      : '暂无时间线事件';

    return `你是一个专业的小说续写AI，严格根据给定的世界状态续写小说。

## 【绝对禁止 - 违反将导致严重后果】 ##
🚫 死亡角色绝对不能出现、不能复活、不能以任何形式提及
🚫 已丢失/损毁的物品不能使用：${lostItems.length > 0 ? lostItems.join('、') : '无'}
🚫 已封闭/毁灭的地点不能使用：${closedLocations.length > 0 ? closedLocations.join('、') : '无'}
🚫 禁止创造新角色（主角除外）
🚫 禁止改变任何角色的等级或境界

## 【故事时间线（来自timeline_events表）】 ##
${timelineContext}
⚠️ 重要：续写必须严格遵循上述时间线顺序，确保剧情连贯性

## 【上一章结尾回顾】 ##
${previousChapterContent ? `上一章最后500字内容（必须严格承接）：
${previousChapterContent.slice(-500)}

⚠️ 关键提示：续写必须严格承接上一章的结尾场景、人物状态和情节发展，不能跳跃或重置。
` : '这是第一章，无需承接前文。'}

## 【允许使用的资源】 ##
存活主角：
${aliveCharacterDetails || '无'}

存活配角：
${minorCharacterList || '无'}

可用物品：
${itemList || '无'}

可用地点：
${locationList || '无'}

## 【世界设定】 ##
类型：${worldState?.genre || '未知'}
风格：${worldState?.style || '通用风格'}
规则：${worldState?.rules || '无'}
背景：${worldState?.background || '无'}

## 【当前剧情摘要】 ##
${summary || '故事刚开始'}
${ragContext ? `
## 【检索到的相关前文（RAG，须承接、不得矛盾）】 ##
以下内容来自本书已有章节或摘要的片段，续写时必须与之衔接，不得编造与下列事实冲突的情节：
${ragContext}
` : ''}

## 【用户指令】 ##
${userInput}

## 【续写要求】 ##
1. 字数要求：${wordCount}字（误差±50字）
2. 📌 **场景衔接**：必须从上一章结尾的场景继续，不能突然切换地点或时间
3. 📌 **人物状态**：角色状态、位置、情绪必须与上一章结尾保持一致
4. 📌 **情节推进**：基于上一章的发展自然推进，解决或延续悬念
5. 📌 **氛围延续**：保持与上一章一致的情感基调和叙事节奏
6. 📌 **对话连贯**：如果上一章有未完成的对话或事件，需要自然收尾或延续
7. 📌 **时间线遵循**：续写内容必须符合上述时间线事件顺序，不能颠倒或跳过重要事件
8. 只使用"存活角色"列表中的角色
9. 物品必须从"可用物品"中选择，持有者必须正确
10. 地点必须从"可用地点"中选择
11. 必须遵循世界规则
12. 只输出小说正文，不要输出任何JSON或说明

## 【写作前准备】 ##
在开始续写之前，请先确认：
- 上一章结尾的场景是什么？（地点、时间、人物位置）
- 本章将使用哪些角色？（从存活列表选择2-4个）
- 本章将使用哪些物品？（从可用列表选择相关物品）
- 本章将发生在哪个地点？
- 本章在时间线中的位置？（参考时间线事件）
- 本章的核心事件是什么？
- 如何承接上一章的悬念或冲突？
- 本章节与前后时间线事件的关系？

现在开始续写（${wordCount}字）：`;
  }

  // 构建摘要提取Prompt
  buildSummaryPrompt(storyContent, worldState, characters, items, locations, minorCharacters) {
    const characterNames = characters.map(c => c.name);
    const characterStatusMap = {};
    characters.forEach(c => { characterStatusMap[c.name] = c.status; });

    const itemNames = items.map(i => i.name);
    const itemOwnerMap = {};
    items.forEach(i => { itemOwnerMap[i.name] = i.owner || '无主'; });

    const locationNames = locations.map(l => l.name);
    const locationStatusMap = {};
    locations.forEach(l => { locationStatusMap[l.name] = l.status; });

    const minorCharacterNames = minorCharacters.map(m => m.name);

    return `你是一个严谨的数据提取AI。分析小说内容，提取关键元素更新数据库。

## 【提取规则】 ##
1. **角色**：只能更新已存在的角色状态，禁止创造新角色
2. **物品**：从小说内容中识别出现的物品，包括已有物品的状态更新和新物品的创建
3. **地点**：从小说内容中识别场景地点，包括已有地点的状态更新和新地点的创建
4. **配角**：可以创建新的配角（标记is_new=true）或更新已有配角
5. 死亡状态不可逆

## 【当前数据库状态】 ##
主要角色及其状态：
${characterNames.map(n => `- ${n}: ${characterStatusMap[n]}`).join('\n') || '无'}

已有物品及其持有者：
${itemNames.map(n => `- ${n}: 持有者=${itemOwnerMap[n]}`).join('\n') || '暂无'}

已有地点及其状态：
${locationNames.map(n => `- ${n}: ${locationStatusMap[n]}`).join('\n') || '暂无'}

已存在配角：
${minorCharacterNames.join('、') || '无'}

## 【小说内容】 ##
${storyContent}

## 【提取指南】 ##
- **物品提取**：仔细阅读小说，识别出现的宝物、武器、道具、秘籍等物品。如果是新出现的物品（不在"已有物品"列表中），标记 is_new=true
- **地点提取**：识别小说中的场景地点，如门派、城池、山脉、秘境等。新地点标记 is_new=true
- **类型定义**：物品类型如"武器"、"法宝"、"丹药"、"秘籍"、"材料"等；地点类型如"门派"、"城池"、"山脉"、"秘境"、"洞穴"等

## 【输出格式】 ##
只输出以下JSON格式，不要任何其他内容：
{
  "chapter_title": "10字以内标题",
  "chapter_outline": "100字以内大纲",
  "character_updates": [
    {
      "name": "角色名",
      "new_status": "正常/受伤/死亡",
      "level": 当前等级数字,
      "change": "状态变化说明"
    }
  ],
  "minor_character_updates": [
    {
      "name": "配角名",
      "role": "路人/炮灰/店主/守卫/商人/弟子等",
      "status": "正常/受伤/死亡",
      "description": "50字以内描述",
      "items": ["持有物品"],
      "is_new": true
    }
  ],
  "item_updates": [
    {
      "name": "物品名",
      "type": "物品类型",
      "owner": "持有者",
      "status": "存在/丢失/损毁",
      "is_new": true
    }
  ],
  "location_updates": [
    {
      "name": "地点名",
      "type": "地点类型",
      "status": "正常/封闭/毁灭",
      "description": "描述",
      "is_new": true
    }
  ],
  "world_updates": {},
  "summary": "200字以内摘要"
}

## 【验证清单】 ##
- [ ] 角色名是否都在主要角色列表中？
- [ ] 物品是否正确标记了 is_new（新物品=true，已有物品=false或不标记）？
- [ ] 地点是否正确标记了 is_new（新地点=true，已有地点=false或不标记）？
- [ ] 是否提取了小说中实际出现的所有重要物品和地点？

现在输出JSON：`;
  }

  // 构建大纲解析Prompt
  buildOutlineParsePrompt(outline) {
    return `你是一个专业的小说分析AI。请分析以下小说大纲，提取关键要素用于初始化小说生成系统。

======================== 用户输入的小说大纲 ========================
${outline}

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "world": {
    "genre": "小说类型（玄幻/修仙/武侠/都市/科幻/魔法/历史/其他）",
    "style": "写作风格（详细描述，包含以下要点）：\\n1. 语言风格：（如：文言文、白话文、诗意、简洁、华丽等）\\n2. 叙事节奏：（如：快节奏、慢节奏、张弛有度等）\\n3. 描写方式：（如：细腻、粗犷、写意、写实等）\\n4. 对话风格：（如：简洁、幽默、正式、口语化等）\\n5. 情感基调：（如：热血、轻松、沉重、悲壮等）",
    "rules": "世界规则",
    "background": "世界背景",
    "realm_system": {
      "has_realm": true/false,
      "realms": ["境界1", "境界2", "..."],
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

⚠️ 写作风格提取规则：
1. 如果大纲中明确提到风格（如"文笔优美"、"节奏紧凑"），必须详细提取
2. 如果大纲中有示例文本，分析其风格特点
3. 根据小说类型推断合适的风格：
   - 玄幻/修仙：可以偏向古风、诗意、气势磅礴
   - 武侠：古风、侠义、快意恩仇
   - 都市：现代、简洁、贴近生活
   - 科幻：理性、逻辑、未来感
   - 历史：古朴、厚重、考究
4. 风格描述要具体，包含5个要点：语言风格、叙事节奏、描写方式、对话风格、情感基调
5. 每个要点要给出明确的特征描述

⚠️ 风格示例：
好的风格描述：
"1. 语言风格：半文半白，融合古典韵味与现代表达，句式灵活多变
2. 叙事节奏：张弛有度，战斗场景快节奏，日常场景慢节奏
3. 描写方式：细腻写实，注重环境氛围营造和心理描写
4. 对话风格：简洁有力，符合角色身份，偶有幽默
5. 情感基调：热血向上，积极正面，偶有轻松幽默"

差的风格描述：
"热血风格"（太笼统）
"好看的风格"（没有具体信息）

⚠️ 智能境界系统规则：
1. 如果是玄幻/修仙/武侠/魔法类型，必须设置has_realm=true并提供境界列表
2. 玄幻修仙示例：["炼气期", "筑基期", "金丹期", "元婴期", "化神期"]
3. 武侠示例：["后天", "先天", "宗师", "大宗师", "天人"]
4. 魔法示例：["学徒", "初级法师", "中级法师", "高级法师", "大魔导师"]
5. 都市/科幻/历史类型，设置has_realm=false，不需要realms字段
6. 如果有境界系统，角色的realm字段必须填写具体境界
7. 如果没有境界系统，角色的realm字段为null，level保持数字

⚠️ 其他注意事项：
1. 至少提取1个主角
2. 可以提取2-5个重要角色
3. 世界规则要具体明确
4. 如果大纲中没有明确信息，可以合理推断
5. 确保JSON格式完全正确

现在开始分析并输出JSON：`;
  }

  // 构建章节大纲生成Prompt（新功能）
  buildChapterOutlinePrompt(worldState, characters, summary, chapterCount, items = [], locations = []) {
    // 角色列表
    const characterList = characters.map(c => {
      const realmOrLevel = c.realm || `Lv.${c.level}`;
      return `【${c.name}】${realmOrLevel} | 状态:${c.status}`;
    }).join('\n');
    
    // 筛选存活角色
    const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、');
    
    // 物品列表
    const itemList = items.length > 0 
      ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
      : '暂无';

    // 地点列表
    const locationList = locations.length > 0
      ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
      : '暂无';
    
    return `你是一个专业的小说大纲规划AI。请根据当前小说状态，生成接下来${chapterCount}章的章节大纲。

======================== 世界设定（来自world_state表）========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【规则】${worldState?.rules || '无'}
【背景】${worldState?.background || '无'}

======================== 角色状态（来自character_state表）========================
${characterList}

⚠️ 存活角色：${aliveCharacters || '无'}
⚠️ 已死亡角色：${deadCharacters || '无'}

======================== 物品状态（来自item_state表）========================
${itemList}

======================== 地点状态（来自location_state表）========================
${locationList}

======================== 当前剧情摘要（来自story_summary表）========================
${summary || '故事刚开始'}

======================== 📌 章节大纲规划策略 ========================
⚠️ 重要：规划章节大纲时，必须结合上述状态表，为每章智能分配关键点：

【角色分配】
- 不同章节可以聚焦不同角色，实现角色轮换
- 主角可以贯穿多章，配角按需出现
- 考虑角色成长弧线，合理安排角色发展
- 死亡角色不能在后续章节中出现

【物品线索】
- 规划物品在不同章节中的作用（获得/使用/转移/损毁）
- 重要物品可以作为章节的核心线索
- 考虑物品与角色、剧情的关联
- 可以设计新物品的出现时机

【地点规划】
- 合理安排场景切换，避免频繁跳转
- 某些章节可以深入探索特定地点
- 地点状态变化可以作为重要情节点
- 考虑地点与角色行动的逻辑关系

【剧情节奏】
- 前几章：铺垫和引入，建立冲突
- 中间章：发展和高潮，推进主线
- 后几章：解决和转折，为下一阶段做准备
- 每章聚焦1-2个核心事件，避免信息过载

【大纲示例】
好的大纲：第3章 - 张三在天元城寻找丢失的秘籍，遇到神秘商人，获得线索指向黑风谷
差的大纲：第3章 - 所有角色聚集，讨论各种事情

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapters": [
    {
      "chapter_number": 1,
      "title": "章节标题（简洁有吸引力）",
      "outline": "200字以内的章节大纲，必须包含：主要角色、核心事件、涉及的物品/地点、预期结果",
      "key_elements": {
        "characters": ["本章主要角色"],
        "items": ["本章涉及的物品"],
        "locations": ["本章场景地点"]
      }
    }
  ]
}

⚠️ 注意事项：
1. 生成${chapterCount}章的大纲
2. 章节要有连贯性和递进关系
3. 符合小说类型和风格
4. 每章大纲要具体，包含关键情节点
5. 合理分配角色、物品、地点到不同章节
6. 避免每章都出现所有元素
7. 考虑剧情节奏和张弛有度
8. 确保JSON格式正确

现在开始生成章节大纲：`;
  }
}

export default new AIClient();
