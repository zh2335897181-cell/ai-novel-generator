import axios from 'axios';

// 统一解析AI配置：优先使用用户自定义配置，回退到环境变量
export function resolveAIConfig(aiConfig = {}) {
  return {
    apiKey: aiConfig.apiKey || process.env.AI_API_KEY,
    baseURL: aiConfig.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1',
    model: aiConfig.model || process.env.AI_MODEL || 'deepseek-v4-flash'
  };
}

class AIClient {
  // 判断错误是否可重试（5xx、网络错误、限流）
  _isRetryableError(error) {
    const status = error.response?.status;
    if (status && status >= 500 && status < 600) return true;
    if (status === 429) return true; // rate limit
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') return true;
    if (error.message?.includes('timeout')) return true;
    return false;
  }

  // 带重试的AI调用
  async _withRetry(fn, maxRetries = 2) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries && this._isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
          console.warn(`[AI] 调用失败，${delay}ms后重试 (${attempt + 1}/${maxRetries}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }
    throw lastError;
  }

  async chat(messages, temperature = 0.7, config, maxTokens = 2000) {
    const { apiKey, baseURL, model } = resolveAIConfig(config);

    if (!apiKey) {
      throw new Error('请先配置AI API Key');
    }

    return this._withRetry(async () => {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          response_format: { type: 'text' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );
      return response.data.choices[0].message.content;
    }).catch(error => {
      console.error('AI调用失败:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'AI生成失败');
    });
  }

  // 流式聊天（新增）
  async chatStream(messages, temperature = 0.7, config, onChunk, maxTokens = 2000) {
    const { apiKey, baseURL, model } = resolveAIConfig(config);

    if (!apiKey) {
      throw new Error('请先配置AI API Key');
    }

    // 流式调用支持连接级重试（流开始后不重试）
    const doStreamRequest = async () => {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: temperature,
          max_tokens: maxTokens,
          stream: true,
          response_format: { type: 'text' }
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
      const decoder = new TextDecoder('utf-8', { stream: true });
      let lineBuffer = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const text = decoder.decode(chunk, { stream: true });
          lineBuffer += text;

          // SSE lines end with \n\n, process complete lines
          const lines = lineBuffer.split('\n');
          // Keep the last (potentially incomplete) line in the buffer
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.includes('[DONE]')) continue;
            if (!trimmed.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(trimmed.substring(6));
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
          // Process any remaining buffered data
          try {
            const final = decoder.decode();
            lineBuffer += final;
            const remaining = lineBuffer.trim();
            if (remaining && remaining.startsWith('data: ') && !remaining.includes('[DONE]')) {
              try {
                const data = JSON.parse(remaining.substring(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              } catch (e) { /* ignore */ }
            }
          } catch (e) { /* ignore */ }
          resolve(fullContent);
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    };

    return this._withRetry(doStreamRequest).catch(error => {
      console.error('AI流式调用失败:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'AI生成失败');
    });
  }

  // 生成小说内容
  async generateStory(worldState, characters, summary, userInput, config, items = [], locations = [], minorCharacters = [], wordCount = 800, ragContext = '', previousChapterContent = '', timelineEvents = [], chapterNumber = 1, chapterTitle = '') {
    const prompt = this.buildStoryPrompt(worldState, characters, summary, userInput, items, locations, minorCharacters, wordCount, ragContext, previousChapterContent, timelineEvents, chapterNumber, chapterTitle);
    return await this.chat([{ role: 'user', content: prompt }], 0.8, config);
  }

  // 生成小说内容（流式）
  async generateStoryStream(worldState, characters, summary, userInput, config, items, locations, minorCharacters, wordCount, onChunk, ragContext = '', previousChapterContent = '', timelineEvents = [], chapterNumber = 1, chapterTitle = '') {
    const prompt = this.buildStoryPrompt(worldState, characters, summary, userInput, items, locations, minorCharacters, wordCount, ragContext, previousChapterContent, timelineEvents, chapterNumber, chapterTitle);
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
        chapter_title: '',
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
    const result = await this.chat([{ role: 'user', content: prompt }], 0.5, config, 8000);
    return this.parseJSON(result, '大纲拆解');
  }

  // 生成章节大纲
  async generateChapterOutlines(worldState, characters, summary, chapterCount, items, locations, minorCharacters = [], timelineEvents = [], config) {
    const prompt = this.buildChapterOutlinePrompt(worldState, characters, summary, chapterCount, items, locations, minorCharacters, timelineEvents);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config, 8000);
    return this.parseJSON(result, '章节大纲');
  }

  // 为指定章节生成大纲（批量，一次AI调用）
  async generateSpecificChapterOutlines(worldState, characters, summary, chapters, items, locations, config) {
    const prompt = this.buildSpecificChaptersOutlinePrompt(worldState, characters, summary, chapters, items, locations);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config, 8000);
    return this.parseJSON(result, '章节大纲');
  }

  // 为单个章节生成大纲（逐章调用，用于进度展示）
  async generateSingleChapterOutline(worldState, characters, summary, chapterInfo, items, locations, config) {
    const prompt = this.buildSingleChapterOutlinePromptSimple(worldState, characters, summary, chapterInfo, items, locations);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config, 4096);
    return this.parseJSON(result, '单章大纲');
  }

  // 构建小说生成Prompt
  buildStoryPrompt(worldState, characters, summary, userInput, items = [], locations = [], minorCharacters = [], wordCount = 800, ragContext = '', previousChapterContent = '', timelineEvents = [], chapterNumber = 1, chapterTitle = '') {
    // 解析 world_state.extra（可能存储了世界观扩展信息）
    let worldExtra = '';
    try {
      if (worldState?.extra) {
        const extra = typeof worldState.extra === 'string' ? JSON.parse(worldState.extra) : worldState.extra;
        const extraParts = [];
        if (extra.power_system) extraParts.push(`力量体系: ${extra.power_system}`);
        if (extra.world_levels) extraParts.push(`世界层级: ${extra.world_levels}`);
        if (extra.organizations) extraParts.push(`主要势力: ${extra.organizations}`);
        if (extra.history_events) extraParts.push(`重大历史: ${extra.history_events}`);
        if (extra.special_rules) extraParts.push(`特殊规则: ${extra.special_rules}`);
        if (extraParts.length > 0) worldExtra = extraParts.join('\n');
      }
    } catch (e) { /* ignore */ }

    // 解析境界体系
    let realmInfo = '';
    try {
      if (worldState?.realm_system) {
        const rs = typeof worldState.realm_system === 'string' ? JSON.parse(worldState.realm_system) : worldState.realm_system;
        if (rs.realms && Array.isArray(rs.realms) && rs.realms.length > 0) {
          realmInfo = `\n境界体系: ${rs.realms.join(' → ')}`;
        } else if (Array.isArray(rs) && rs.length > 0) {
          realmInfo = `\n境界体系: ${rs.join(' → ')}`;
        }
      }
    } catch (e) { /* ignore */ }

    const aliveCharacters = characters.filter(c => c.status !== '死亡');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name);
    const aliveList = aliveCharacters.map(c => c.name).join('、');
    const deadList = deadCharacters.join('、');

    const aliveCharacterDetails = aliveCharacters.map(c => {
      let attrs = {};
      try {
        if (typeof c.attributes === 'string') attrs = JSON.parse(c.attributes);
        else if (c.attributes && typeof c.attributes === 'object') attrs = c.attributes;
      } catch (e) { attrs = {}; }
      const attrStr = Object.keys(attrs).length > 0 ? ` | 属性: ${JSON.stringify(attrs)}` : '';
      const realmInfoStr = c.realm ? `境界:${c.realm}` : `等级:Lv.${c.level}`;
      return `【${c.name}】${realmInfoStr}${attrStr}`;
    }).join('\n');

    const itemList = items.length > 0
      ? items.map(i => {
          let attrs = {};
          try {
            if (typeof i.attributes === 'string') attrs = JSON.parse(i.attributes);
            else if (i.attributes && typeof i.attributes === 'object') attrs = i.attributes;
          } catch (e) { attrs = {}; }
          const attrStr = Object.keys(attrs).length > 0 ? ` | 详情: ${JSON.stringify(attrs)}` : '';
          return `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无主'} | 状态:${i.status}${attrStr}`;
        }).join('\n')
      : '暂无';

    const locationList = locations.length > 0
      ? locations.map(l => {
          let attrs = {};
          try {
            if (typeof l.attributes === 'string') attrs = JSON.parse(l.attributes);
            else if (l.attributes && typeof l.attributes === 'object') attrs = l.attributes;
          } catch (e) { attrs = {}; }
          const attrStr = Object.keys(attrs).length > 0 ? ` | 属性: ${JSON.stringify(attrs)}` : '';
          return `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}${attrStr}`;
        }).join('\n')
      : '暂无';

    const minorCharacterList = minorCharacters.length > 0
      ? minorCharacters.map(m => {
          let charItems = '';
          try {
            const parsed = m.items ? (typeof m.items === 'string' ? JSON.parse(m.items) : m.items) : null;
            if (Array.isArray(parsed) && parsed.length > 0) charItems = ` | 持有物品: ${parsed.join(', ')}`;
          } catch (e) { /* ignore */ }
          const desc = m.description ? ` | 描述: ${m.description}` : '';
          const appear = m.first_appearance ? ` | 首次出场: 第${m.first_appearance}章` : '';
          return `【${m.name}】角色:${m.role || '路人'} | 状态:${m.status}${desc}${charItems}${appear}`;
        }).join('\n')
      : '暂无';

    const closedLocations = locations.filter(l => l.status === '封闭' || l.status === '毁灭').map(l => l.name);
    const lostItems = items.filter(i => i.status === '丢失' || i.status === '损毁').map(i => i.name);

    const timelineContext = timelineEvents && timelineEvents.length > 0
      ? timelineEvents.map(e => {
          const dateStr = e.event_date ? new Date(e.event_date).toLocaleDateString() : '时间未定';
          const chapterStr = e.related_chapter ? `(第${e.related_chapter}章)` : '';
          return `- ${dateStr} ${chapterStr} 【${e.type}】${e.title}: ${e.description || '无描述'}`;
        }).join('\n')
      : '暂无时间线事件';

    const writingStyle = worldState?.style
      ? `\n## 【写作风格（用户自定义，最高优先级）】 ##\n${worldState.style}\n\n⚠️ 必须严格遵循上述风格设定，这比通用写作要求更重要。`
      : '';

    const chapterInfo = chapterTitle
      ? `这是第${chapterNumber}章，本章标题：《${chapterTitle}》`
      : `这是第${chapterNumber}章`;

    // 根据类型和风格生成叙事声音指导
    const genre = worldState?.genre || '';
    const style = worldState?.style || '';
    const narrativeVoice = this._buildNarrativeVoice(genre, style, characters);
    const antiPatterns = this._buildAntiAIPatterns();
    const genreGuidance = this._buildGenreGuidance(genre);

    return `你是一位中文网络小说作家。你的文字有辨识度——读者看几句就知道是你的作品，而不是AI生成的。你有自己的语言习惯、常用句式和独特的节奏感。你不写"正确但无趣"的文字，你写"有毛边但鲜活"的文字。

## 【当前章节信息】 ##
${chapterInfo}
⚠️ 请围绕本章标题展开创作，确保内容与标题主题一致。

${narrativeVoice}

======================== 反AI模式规则 ========================
${antiPatterns}

======================== ${genre ? genre + '类型' : ''}创作指导 ========================
${genreGuidance}

## 【核心写作原则】 ##
1. **展示而非说教**：用动作、对话、环境来传达情感。"他的手在发抖"比"他很紧张"好一百倍
2. **情感驱动**：每个场景有情感内核。不要写"他很愤怒"，写"他一脚踹翻了桌子，茶盏碎了一地，屋里鸦雀无声"
3. **感官细节**：每500字至少出现一种具体感官——铁锈的气味、冰凉的青石板、远处模糊的叫卖声、指腹摩挲粗糙剑柄的触感
4. **对话即性格**：每个人物说话方式不同。有人每句不超过五个字，有人滔滔不绝但总跑题，有人说话带口头禅
5. **节奏变化**：紧张时短句连击，舒缓时长句铺陈。不要每段都是"他做了A，然后B，接着C"
6. **留白**：重要的情感不要直接说出来。用沉默、动作、环境来暗示
7. **具体而非抽象**：不说"一个强大的法宝"，说"一枚核桃大小的铜铃，晃动时发出令人牙酸的嗡鸣"

## 【绝对禁止 - 违反将导致严重后果】 ##
🚫 死亡角色绝对不能出现、不能复活、不能以任何形式提及
🚫 已丢失/损毁的物品不能使用：${lostItems.length > 0 ? lostItems.join('、') : '无'}
🚫 已封闭/毁灭的地点不能使用：${closedLocations.length > 0 ? closedLocations.join('、') : '无'}
🚫 禁止创造新角色（主角除外）
🚫 禁止改变任何角色的等级或境界

## 【故事时间线（来自timeline_events表）】 ##
${timelineContext}
⚠️ 重要：创作必须严格遵循上述时间线顺序，确保剧情连贯性

## 【上一章结尾回顾】 ##
${previousChapterContent ? `上一章最后500字内容（必须严格承接）：
${previousChapterContent.slice(-500)}

⚠️ 关键提示：创作必须严格承接上一章的结尾场景、人物状态和情节发展，不能跳跃或重置。
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
类型：${genre || '未知'}
风格：${style || '通用风格'}${realmInfo}
规则：${worldState?.rules || '无'}
背景：${worldState?.background || '无'}${worldExtra ? '\n扩展设定:\n' + worldExtra : ''}${writingStyle}

## 【当前剧情摘要】 ##
${summary || '故事刚开始'}
${ragContext ? `
## 【检索到的相关前文（RAG，须承接、不得矛盾）】 ##
以下内容来自本书已有章节或摘要的片段，创作时必须与之衔接，不得编造与下列事实冲突的情节：
${ragContext}
` : ''}

## 【用户指令】 ##
${userInput}

## 【创作要求】 ##
1. 字数要求：${wordCount}字（误差±50字）
2. 📌 **场景衔接**：必须从上一章结尾的场景继续，不能突然切换地点或时间
3. 📌 **人物状态**：角色状态、位置、情绪必须与上一章结尾保持一致
4. 📌 **情节推进**：基于上一章的发展自然推进，解决或延续悬念
5. 📌 **氛围延续**：保持与上一章一致的情感基调和叙事节奏
6. 📌 **对话连贯**：如果上一章有未完成的对话或事件，需要自然收尾或延续
7. 📌 **时间线遵循**：创作内容必须符合上述时间线事件顺序，不能颠倒或跳过重要事件
8. 只使用"存活角色"列表中的角色
9. 物品必须从"可用物品"中选择，持有者必须正确
10. 地点必须从"可用地点"中选择
11. 必须遵循世界规则
12. 只输出小说正文，不要输出任何JSON或说明

## 【写作前自检】 ##
下笔前在心里过一遍：
- 上一章结尾的场景和人物情绪是什么？
- 本章的情感主线是什么？（不要每章都一样）
- 哪些角色出场？他们各自的性格和口头禅是什么？
- 有没有哪句话读者能"听"到声音、"闻"到气味、"感受"到温度？
- 人物的对话里有潜台词吗？还是把所有话都说透了？
- 本章出现了多少次"突然"、"立刻"、"顿时"？——如果有，删掉重写

现在，开始创作（${wordCount}字）：`;
  }

  // 根据类型/风格构建叙事声音
  _buildNarrativeVoice(genre, style, characters) {
    const mainChar = characters?.find(c => c.status !== '死亡');
    const charName = mainChar?.name || '主角';

    const voiceMap = {
      '热血爽文': `【叙事声音】采用快节奏、高冲击力的叙事。短句为主，动词有力。像战鼓一样有节奏感。${charName}的视角主导叙事，读者通过他的眼睛感受每一次突破和战斗。`,
      '轻松搞笑': `【叙事声音】采用轻松诙谐的语调。叙事中可以穿插内心吐槽、意外反转、反差萌。不必每句话都严肃，允许幽默的比喻和夸张。${charName}的内心OS可以很有意思。`,
      '沉稳厚重': `【叙事声音】采用沉稳、克制的语调。句子可以稍长，描写细腻，节奏从容。像一个老者在爐火旁讲故事。不追求爽快，追求余味。`,
      '诙谐幽默': `【叙事声音】叙事中融入冷幽默和反讽。对话可以有机锋，描写可以有反差。人物可以有各种"不完美"的小动作和小毛病。`,
      '暗黑残酷': `【叙事声音】采用冷峻、克制的笔调。不渲染暴力本身，但通过细节和后果让人感到寒意。留白比直写更有力。道德灰色地带是故事的底色。`,
      '温馨治愈': `【叙事声音】采用温暖、细腻的笔调。关注日常中的小美好，人物之间的羁绊和善意。节奏舒缓但不拖沓。`,
      '史诗宏大': `【叙事声音】采用开阔的叙事视野。适当使用多线并进、视角切换。语言有厚重感，不拘泥于琐碎细节而是抓住时代洪流中人物的命运。`,
      '紧张刺激': `【叙事声音】采用紧凑的、高密度的叙事。悬念层层递进，每个章节结尾留钩子。多用短段、短句营造呼吸急促的阅读节奏。`,
      '悬疑推理': `【叙事声音】采用冷静、精确的叙事。细节是关键——一个不起眼的物品、一句看似随意的话都可能是伏笔。信息释放有节制，让读者自己拼图。`,
      '文艺细腻': `【叙事声音】采用文学性较强的语言。注重意象的营造、情绪的流淌。句子可以有韵律感，描写可以入微。`,
      '写实冷峻': `【叙事声音】采用白描式的语言，克制、干净。不煽情、不渲染。像纪录片一样呈现事件和人物，让读者自己做判断。`,
    };

    let voice = voiceMap[style] || '';

    // 如果没有匹配的风格，根据类型生成
    if (!voice) {
      if (genre?.includes('修仙') || genre?.includes('玄幻')) {
        voice = `【叙事声音】采用半文半白的语言风格，在古典韵味和现代阅读感之间取平衡。${charName}的成长是主线，每次突破应有实感而非一笔带过。`;
      } else if (genre?.includes('都市')) {
        voice = `【叙事声音】采用现代、利落的语言。对话要像真实的人在说话，场景要能让读者在脑海中"看到"。`;
      } else if (genre?.includes('科幻')) {
        voice = `【叙事声音】采用理性但不冰冷的语调。科技设定通过人物体验来呈现，不生硬解释。`;
      } else if (genre?.includes('武侠')) {
        voice = `【叙事声音】采用有古风韵味但不生涩的语言。武打场面重在动作的节奏感和画面感，不堆砌招式名。`;
      }
    }

    if (!voice) {
      voice = `【叙事声音】发展出你自己的叙事声音。语言要有辨识度——读者读几句就知道是你的文字。`;
    }

    return voice;
  }

  // 构建反AI模式规则
  _buildAntiAIPatterns() {
    return `以下是AI写作最常见的问题。你的任务不是避免它们，而是让你的文字看起来根本不像AI写的：

❌ AI句式一："X不仅…而且…更…"
   例：这不仅是一次考验，而且是一次蜕变，更是一次重生
   → 这种句式出现一次都嫌多。换说法："考验也好，蜕变也罢——他只需要活下来。"

❌ AI句式二："似乎…却又…仿佛…"
   例：他似乎想说什么，却又欲言又止，仿佛有什么难言之隐
   → 太套路了。"他张了张嘴。什么也没说。"

❌ AI句式三：大段的情绪分析
   例：他感到一阵复杂的情绪涌上心头，有愤怒，有不甘，还有一丝说不清道不明的惆怅
   → 不要分析情绪。写他做了什么：他盯着那封信看了很久，然后慢慢把它折起来，放进口袋里。

❌ AI句式四：每段结构相同
   不要：描写→对话→内心→总结 → 描写→对话→内心→总结 → ...
   段落之间应该有呼吸感。有的段落可以只有一句对话。有的可以全是动作。

❌ AI句式五：滥用"突然""立刻""顿时""随即"
   这些词每章最多出现3次。情节的转折靠情境推动，不靠"突然"来制造紧张感。

❌ AI句式六：人物对话像是在做报告
   "根据我的观察，当前的局势对我们非常不利，我建议我们应该..."
   → 真实的人不这样说话。试试："妈的，麻烦了。"

❌ AI句式七：感情戏写成情感说明书
   不说"两人之间的气氛变得暧昧起来"。
   写：她低头整理衣角，他没话找话地说了句今天天气不错。两人同时沉默了五秒。有点太长了。

❌ AI句式八：战斗场面写成招式列表
   不说"他先是使出一招横扫千军，紧接着接上一招回马枪"。
   写动作的节奏和结果：剑锋划过空气的尖啸，金属碰撞的火星，虎口震裂的血。

❌ AI句式九：结尾总是"升华"
   不要让每章结尾都像中学生作文的"点题"。有时戛然而止更有力。有时一个画面就够了。

❌ AI句式十：形容词通货膨胀
   不要把"好"写成"极好"，再写成"无与伦比的卓越"。
   具体比夸张有力量。"他很强"不如"他一拳打穿了半尺厚的石墙"。`;
  }

  // 根据类型生成创作指导
  _buildGenreGuidance(genre) {
    if (!genre) return '根据你的判断选择最合适的叙事方式。';

    const guidance = {
      '修仙': `- 境界突破要有仪式感，不是简单的"突破了"，而是身体、感知、天象的真实改变
- 功法的描写要有"质感"——这本残卷为什么特别？它的来历、它的代价、它的限制
- 修炼不是打怪升级。每次突破应该伴随代价、风险、或者道德抉择`,

      '玄幻': `- 世界观的展示通过人物体验，而非旁白介绍。让读者跟随主角的视角逐步发现世界的规则
- 战斗场面重节奏和画面感，不堆砌技能名称。一个有力的动作胜过十招列举
- 奇遇要有"分量感"——获得强大的力量同时也意味着更大的责任或代价`,

      '都市': `- 对话是灵魂。都市小说的对话要真的像当代人在说话——有网络用语、有口头禅、有弦外之音
- 场景描写要让读者"看到"画面。写一个办公室、一家咖啡店、一条街——写出它独有的细节
- 人物关系靠互动来展示，不是靠旁白交代`,

      '系统': `- 系统是工具不是主角。不要让系统面板和数值淹没了人物和情节
- 系统提示要有"性格"——可以冷冰冰、可以俏皮、可以腹黑，但不能像产品说明书
- 数值的增长要有叙事意义。Lv.5→Lv.6不是重点，解锁了"能听到他人心声"这个能力才是`,

      '科幻': `- 技术设定通过人物体验和情节来呈现，避开"数据堆"式的说明段落
- 科幻的核心是"如果…会怎样"的思想实验，不是技术说明书
- 未来世界的日常感很重要——再先进的科技，对生活在其中的人来说就是日常`,

      '武侠': `- 动作描写的节奏感重于招式名。用短句和动词营造画面
- "江湖"不是背景板，是人际关系网、是利益纠葛、是恩怨情仇
- 武功的传承和代价比武功本身更值得写`,
    };

    for (const [key, text] of Object.entries(guidance)) {
      if (genre.includes(key)) return text;
    }

    return '';
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
  buildChapterOutlinePrompt(worldState, characters, summary, chapterCount, items = [], locations = [], minorCharacters = [], timelineEvents = []) {
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

    // 配角列表
    const minorList = minorCharacters.length > 0
      ? minorCharacters.map(m => `【${m.name}】角色:${m.role || '路人'} | 状态:${m.status}`).join('\n')
      : '暂无';

    // 时间线
    const timeline = timelineEvents.length > 0
      ? timelineEvents.map(e => `- ${e.event_date ? new Date(e.event_date).toLocaleDateString() : '?'} 【${e.type}】${e.title}: ${e.description || ''}`).join('\n')
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

======================== 配角信息（来自minor_character_state表）========================
${minorList}

======================== 物品状态（来自item_state表）========================
${itemList}

======================== 地点状态（来自location_state表）========================
${locationList}

======================== 故事时间线（来自timeline_events表）========================
${timeline}

======================== 当前剧情摘要（来自story_summary表）========================
${summary || '故事刚开始'}

======================== 📌 章节大纲规划策略 ========================
⚠️ 重要：规划章节大纲时，必须结合上述状态表，为每章智能分配关键点：

【角色分配】
- 不同章节可以聚焦不同角色，实现角色轮换
- 主角可以贯穿多章，配角（包括minor角色）按需出现
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

【时间线遵循】
- 大纲必须与已有时间线事件保持一致
- 时间线中的事件应在对应章节中体现或承接

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

  // 为指定章节构建大纲Prompt（用户已选好标题）
  buildSpecificChaptersOutlinePrompt(worldState, characters, summary, chapters, items = [], locations = []) {
    const characterList = characters.map(c => {
      const realmOrLevel = c.realm || `Lv.${c.level}`;
      return `【${c.name}】${realmOrLevel} | 状态:${c.status}`;
    }).join('\n');

    const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、');

    const itemList = items.length > 0
      ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
      : '暂无';

    const locationList = locations.length > 0
      ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
      : '暂无';

    const chapterList = chapters.map(c => `第${c.chapter_number}章《${c.title}》`).join('\n');

    return `你是一个专业的小说大纲规划AI。请为以下指定的章节逐一生成详细大纲。

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

======================== 需要生成大纲的章节 ========================
${chapterList}

======================== 输出要求 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapters": [
    {
      "chapter_number": 1,
      "title": "章节标题（与输入保持一致）",
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
1. 严格按上述章节列表生成，章节号和标题与输入保持一致
2. 章节之间要有连贯性和递进关系
3. 符合小说类型和风格
4. 每章大纲要具体，包含关键情节点
5. 合理分配角色、物品、地点到不同章节
6. 考虑剧情节奏和张弛有度
7. 确保JSON格式正确

现在开始生成章节大纲：`;
  }

  // 为单个章节构建简化Prompt（无前后章上下文，用于逐章生成+进度展示）
  buildSingleChapterOutlinePromptSimple(worldState, characters, summary, chapterInfo, items = [], locations = []) {
    const characterList = characters.map(c => {
      const realmOrLevel = c.realm || `Lv.${c.level}`;
      return `【${c.name}】${realmOrLevel} | 状态:${c.status}`;
    }).join('\n');

    const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、');

    const itemList = items.length > 0
      ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
      : '暂无';

    const locationList = locations.length > 0
      ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
      : '暂无';

    return `你是一个专业的小说大纲规划AI。请为第${chapterInfo.chapter_number}章《${chapterInfo.title}》生成详细大纲。

======================== 世界设定 ========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【规则】${worldState?.rules || '无'}
【背景】${worldState?.background || '无'}

======================== 角色状态 ========================
${characterList}

存活角色：${aliveCharacters || '无'}
已死亡角色：${deadCharacters || '无'}

======================== 物品状态 ========================
${itemList}

======================== 地点状态 ========================
${locationList}

======================== 当前剧情摘要 ========================
${summary || '故事刚开始'}

======================== 输出要求 ========================
请为第${chapterInfo.chapter_number}章《${chapterInfo.title}》生成一个200字以内的详细大纲。

大纲要求：
1. 围绕章节标题"${chapterInfo.title}"展开，确保内容与标题主题一致
2. 包含本章的主要角色、核心事件、涉及的地点
3. 符合小说的类型和风格设定
4. 大纲要具体，包含关键情节点

必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapter_number": ${chapterInfo.chapter_number},
  "title": "${chapterInfo.title}",
  "outline": "200字以内的详细大纲内容",
  "key_elements": {
    "characters": ["本章主要角色"],
    "items": ["本章涉及的物品"],
    "locations": ["本章场景地点"]
  }
}`;
  }

  // 重新生成单个章节的大纲
  async regenerateSingleChapterOutline(worldState, characters, summary, chapterInfo, items, locations, config) {
    const prompt = this.buildSingleChapterOutlinePrompt(worldState, characters, summary, chapterInfo, items, locations);
    const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config, 4096);
    return this.parseJSON(result, '单章大纲');
  }

  buildSingleChapterOutlinePrompt(worldState, characters, summary, chapterInfo, items = [], locations = []) {
    const characterList = characters.map(c => {
      const realmOrLevel = c.realm || `Lv.${c.level}`;
      return `【${c.name}】${realmOrLevel} | 状态:${c.status}`;
    }).join('\n');

    const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、');
    const deadCharacters = characters.filter(c => c.status === '死亡').map(c => c.name).join('、');

    const itemList = items.length > 0
      ? items.map(i => `【${i.name}】类型:${i.type || '未知'} | 持有者:${i.owner || '无'} | 状态:${i.status}`).join('\n')
      : '暂无';

    const locationList = locations.length > 0
      ? locations.map(l => `【${l.name}】类型:${l.type || '未知'} | 状态:${l.status} | 描述:${l.description || '无'}`).join('\n')
      : '暂无';

    // 获取相邻章节的上下文
    const prevChapter = chapterInfo.prevChapter
      ? `第${chapterInfo.prevChapter.chapter_number}章《${chapterInfo.prevChapter.title}》：${chapterInfo.prevChapter.outline}`
      : '无（这是第一章）';
    const nextChapter = chapterInfo.nextChapter
      ? `第${chapterInfo.nextChapter.chapter_number}章《${chapterInfo.nextChapter.title}》：${chapterInfo.nextChapter.outline}`
      : '无（这是最后一章）';

    return `你是一个专业的小说大纲规划AI。请为第${chapterInfo.chapter_number}章《${chapterInfo.title}》重新生成一个详细的大纲。

======================== 世界设定（来自world_state表）========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【规则】${worldState?.rules || '无'}
【背景】${worldState?.background || '无'}

======================== 角色状态（来自character_state表）========================
${characterList}

存活角色：${aliveCharacters || '无'}
已死亡角色：${deadCharacters || '无'}

======================== 物品状态（来自item_state表）========================
${itemList}

======================== 地点状态（来自location_state表）========================
${locationList}

======================== 当前剧情摘要（来自story_summary表）========================
${summary || '故事刚开始'}

======================== 相邻章节上下文 ========================
上一章：${prevChapter}
下一章：${nextChapter}

======================== 输出要求 ========================
请为第${chapterInfo.chapter_number}章《${chapterInfo.title}》生成一个200字以内的详细大纲。

大纲要求：
1. 必须与上一章和下一章的内容自然衔接，保持故事连贯性
2. 包含本章的主要角色、核心事件、涉及的地点
3. 符合小说的类型和风格设定
4. 大纲要具体，包含关键情节点
5. 围绕章节标题"${chapterInfo.title}"展开，确保内容与标题主题一致

必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapter_number": ${chapterInfo.chapter_number},
  "title": "${chapterInfo.title}",
  "outline": "200字以内的详细大纲内容",
  "key_elements": {
    "characters": ["本章主要角色"],
    "items": ["本章涉及的物品"],
    "locations": ["本章场景地点"]
  }
}`;
  }

  // 生成章节目录（TOC）- 小批量直接生成，大批量自动分批
  async generateTOC(worldState, characters, summary, chapterCount, config, items = [], locations = [], minorCharacters = [], onProgress) {
    // ≤60章：一次生成
    if (chapterCount <= 60) {
      const prompt = this.buildTOCPrompt(worldState, characters, summary, chapterCount, items, locations, minorCharacters);
      const result = await this.chat([{ role: 'user', content: prompt }], 0.7, config, 4096);
      return this.parseJSON(result, 'TOC');
    }

    // >60章：先规划分卷，再逐卷生成
    const BATCH_SIZE = 100;
    const volumeCount = Math.ceil(chapterCount / BATCH_SIZE);

    // 第一阶段：生成分卷规划
    if (onProgress) onProgress({ phase: 'planning', message: '正在规划分卷结构...' });
    const volumePlanPrompt = this.buildVolumePlanPrompt(worldState, characters, summary, chapterCount, BATCH_SIZE, volumeCount, items, locations, minorCharacters);
    const volumePlanRaw = await this.chat([{ role: 'user', content: volumePlanPrompt }], 0.7, config, 2000);
    const volumePlan = this.parseJSON(volumePlanRaw, '分卷规划');

    const allChapters = [];

    // 第二阶段：逐卷生成章节目录
    for (let v = 0; v < volumePlan.volumes.length; v++) {
      const vol = volumePlan.volumes[v];
      const startChapter = v * BATCH_SIZE + 1;
      const endChapter = Math.min((v + 1) * BATCH_SIZE, chapterCount);
      const volChapterCount = endChapter - startChapter + 1;

      if (onProgress) {
        onProgress({
          phase: 'generating',
          message: `正在生成第${v + 1}/${volumePlan.volumes.length}卷（第${startChapter}-${endChapter}章）...`,
          current: v + 1,
          total: volumePlan.volumes.length
        });
      }

      const batchPrompt = this.buildTOCBatchPrompt(
        worldState, characters, summary,
        startChapter, endChapter, volChapterCount,
        vol, volumePlan.volumes.length, chapterCount,
        items, locations, minorCharacters
      );

      // 每卷最多重试2次
      let batchResult = null;
      let lastError = null;
      for (let retry = 0; retry < 2; retry++) {
        try {
          const raw = await this.chat([{ role: 'user', content: batchPrompt }], 0.7, config, 4096);
          batchResult = this.parseJSON(raw, `第${v + 1}卷`);
          break;
        } catch (e) {
          lastError = e;
          if (retry < 1) {
            if (onProgress) onProgress({ phase: 'retry', message: `第${v + 1}卷解析失败，重试中...` });
          }
        }
      }
      if (!batchResult) {
        throw new Error(`第${v + 1}卷（第${startChapter}-${endChapter}章）生成失败: ${lastError?.message}`);
      }

      // 修正章节号
      for (const ch of batchResult.chapters) {
        allChapters.push({
          chapter_number: ch.chapter_number,
          title: ch.title
        });
      }
    }

    // 验证总数
    if (allChapters.length !== chapterCount) {
      console.warn(`TOC生成数量不匹配: 预期${chapterCount}, 实际${allChapters.length}`);
    }

    return { chapters: allChapters, volumes: volumePlan.volumes };
  }

  // 解析JSON（清理markdown代码块）
  parseJSON(raw, label) {
    try {
      let clean = raw.trim();
      // 移除所有 markdown 代码块标记
      clean = clean.replace(/```(?:json|js|javascript)?\s*\n?/gi, '').replace(/```\s*\n?/g, '');
      // 提取第一个完整 JSON 对象/数组
      const first = Math.min(
        clean.indexOf('{') === -1 ? Infinity : clean.indexOf('{'),
        clean.indexOf('[') === -1 ? Infinity : clean.indexOf('[')
      );
      const lastBrace = clean.lastIndexOf('}');
      const lastBracket = clean.lastIndexOf(']');
      const last = Math.max(lastBrace, lastBracket);
      if (first !== Infinity && last > first) {
        clean = clean.substring(first, last + 1);
      }
      // 修复常见 AI JSON 错误
      clean = clean.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(clean);
    } catch (error) {
      console.error(`${label}解析失败，原始内容前500字:`, raw?.substring(0, 500));
      throw new Error(`AI返回格式异常（${label}），请重试`);
    }
  }

  // 分卷规划Prompt
  buildVolumePlanPrompt(worldState, characters, summary, chapterCount, batchSize, volumeCount, items = [], locations = [], minorCharacters = []) {
    const characterNames = characters.map(c => c.name).join('、');
    const itemNames = items.map(i => i.name).join('、') || '暂无';
    const locationNames = locations.map(l => l.name).join('、') || '暂无';
    const minorNames = minorCharacters.map(m => m.name).join('、') || '暂无';

    return `你是一位资深的小说策划编辑。请为一部长篇小说规划分卷结构。

======================== 小说基本信息 ========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【世界背景】${worldState?.background || '未设定'}
【核心规则】${worldState?.rules || '未设定'}
【主要角色】${characterNames || '暂无'}
【配角】${minorNames}
【重要物品】${itemNames}
【主要地点】${locationNames}
【剧情摘要】${summary || '故事刚开始'}

======================== 分卷规划 ========================
全书共${chapterCount}章，每卷约${batchSize}章，共${volumeCount}卷。
请为每卷设计一个主题名称和故事弧线描述。每卷应有明确的故事阶段，卷与卷之间要有递进关系，覆盖完整的开端-发展-转折-高潮-结局。

======================== 输出格式 ========================
严格JSON（无markdown代码块）：
{
  "volumes": [
    {
      "volume_number": 1,
      "title": "卷名（简洁4-8字）",
      "chapter_range": "第1-100章",
      "story_arc": "本卷故事弧线描述（50字内）：主要事件、情感走向、关键转折"
    }
  ]
}

现在规划这${chapterCount}章的分卷结构：`;
  }

  // 单卷章节标题生成Prompt
  buildTOCBatchPrompt(worldState, characters, summary, startChapter, endChapter, volChapterCount, volumeInfo, totalVolumes, totalChapters, items = [], locations = [], minorCharacters = []) {
    const characterNames = characters.map(c => c.name).join('、');
    const itemNames = items.map(i => i.name).join('、') || '暂无';
    const locationNames = locations.map(l => l.name).join('、') || '暂无';
    const minorNames = minorCharacters.map(m => m.name).join('、') || '暂无';

    return `你是一位资深的小说策划编辑。请为长篇小说的一卷生成详细章节目录。

======================== 全书概况 ========================
【总章数】${totalChapters}章，共${totalVolumes}卷
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【世界背景】${worldState?.background || '未设定'}
【主要角色】${characterNames || '暂无'}
【配角】${minorNames}
【重要物品】${itemNames}
【主要地点】${locationNames}
【剧情摘要】${summary || '故事刚开始'}

======================== 当前分卷信息 ========================
【卷名】${volumeInfo.title}
【范围】第${startChapter}-${endChapter}章（共${volChapterCount}章）
【故事弧线】${volumeInfo.story_arc}
${volumeInfo.volume_number > 1 ? `【前卷概要】请承接上一卷《${volumeInfo.title}》之前的故事发展` : '【起始】这是全书开端，请从故事的起点开始'}

======================== 📌 重要创作要求 ========================
1. 标题风格：2-15字，灵活多变，避免千篇一律的四字标题
2. 每章标题要体现该章核心情节，有画面感和吸引力
3. 章节之间要有叙事连贯性，体现故事的递进
4. 避免标题重复或雷同
5. 标题要符合本卷的故事弧线，不偏离主题
6. 风格要匹配小说类型的命名习惯

【标题风格示例（注意长短变化）】
- 穿越到异世界的废柴少年
- 意外传承
- 宗门大比震惊四座
- 秘境惊变之生死一线
- 归来
- 山雨欲来风满楼

======================== 输出格式 ========================
严格JSON（无markdown代码块），必须恰好${volChapterCount}个章节：
{
  "chapters": [
    { "chapter_number": ${startChapter}, "title": "章节标题" },
    { "chapter_number": ${startChapter + 1}, "title": "章节标题" }
  ]
}

现在生成第${startChapter}-${endChapter}章的目录：`;
  }

  // 小批量TOC Prompt（≤60章，直接生成）
  buildTOCPrompt(worldState, characters, summary, chapterCount, items = [], locations = [], minorCharacters = []) {
    const characterNames = characters.map(c => c.name).join('、');
    const aliveCharacters = characters.filter(c => c.status !== '死亡').map(c => c.name).join('、');
    const itemNames = items.map(i => i.name).join('、') || '暂无';
    const locationNames = locations.map(l => l.name).join('、') || '暂无';
    const minorNames = minorCharacters.map(m => m.name).join('、') || '暂无';

    return `你是一位资深的小说策划编辑，擅长为小说规划章节目录。请根据小说的设定和当前状态，为一部长篇小说设计${chapterCount}章的章节目录。

======================== 小说基本信息 ========================
【类型】${worldState?.genre || '未知'}
【风格】${worldState?.style || '未知'}
【世界背景】${worldState?.background || '未设定'}
【核心规则】${worldState?.rules || '未设定'}

======================== 角色信息 ========================
主要角色：${characterNames || '暂无'}
配角：${minorNames}
存活角色：${aliveCharacters || '暂无'}

======================== 可用资源 ========================
重要物品：${itemNames}
主要地点：${locationNames}

======================== 当前剧情摘要 ========================
${summary || '故事刚开始'}

======================== 📌 目录规划要求 ========================
1. **故事弧线**：${chapterCount}章要构成完整的故事结构，包括开端、发展、转折、高潮、结局
2. **标题风格**：每个标题要简洁有力（2-15字），长短灵活，避免千篇一律的四字标题，要有变化和吸引力，体现该章核心内容
3. **节奏把控**：
   - 前10-20%：铺垫世界观，引入冲突
   - 中间40-60%：剧情发展，层层推进
   - 后期20-30%：终极冲突与结局
4. **标题多样性**：避免重复句式，每章标题应各有特色
5. **连贯性**：标题之间要有叙事逻辑，体现故事的递进关系
6. **符合类型**：标题风格必须符合${worldState?.genre || '该小说'}类型的命名习惯

【标题示例（长短结合，避免千篇一律）】
- 穿越到异世界的废柴少年
- 意外传承
- 宗门大比震惊四座
- 秘境惊变之生死一线
- 归来
- 山雨欲来风满楼

======================== 输出格式 ========================
必须输出严格的JSON格式（不要markdown代码块）：
{
  "chapters": [
    { "chapter_number": 1, "title": "章节标题" },
    { "chapter_number": 2, "title": "章节标题" }
  ]
}

现在开始为这部长篇小说设计${chapterCount}章的目录：`;
  }

  // ==================== 小说深度分析 ====================

  buildDeepAnalysisPrompt(allChapters, worldState, characters) {
    const characterNames = characters.map(c => `${c.name}(Lv.${c.level || '?'} ${c.realm || ''})`).join('、');
    const genre = worldState?.genre || '未知';
    const style = worldState?.style || '未知';
    const background = worldState?.background || '未设定';
    const rules = worldState?.rules || '未设定';

    const chaptersText = allChapters.map(ch => {
      const truncated = ch.content && ch.content.length > 2500
        ? ch.content.substring(0, 2000) + '\n...\n' + ch.content.substring(ch.content.length - 500)
        : (ch.content || '');
      return `第${ch.chapter_number}章 ${ch.chapter_title || ''}\n${truncated}`;
    }).join('\n\n---\n\n');

    return `你是一位资深文学评论家，拥有20年以上的小说分析与评论经验。请对以下小说进行全面深度的写作风格和主题思想分析，写一篇专业、优美、有见地的文学评论文章。

======================== 小说基本信息 ========================
【类型】${genre}
【风格】${style}
【世界背景】${background}
【核心规则】${rules}
【主要角色】${characterNames || '暂无'}
【总章节数】${allChapters.length}章

======================== 小说全文内容 ========================
${chaptersText}

======================== 重要：输出要求 ========================
请写一篇完整的文学评论文章。用流畅优美的中文自然段落来表达你的分析，就像《文学评论》杂志上的深度书评一样。

*** 绝对不要输出JSON、代码块、markdown代码围栏 ***
*** 绝对不要输出任何机器可读的结构化格式 ***

你需要严格按照以下标题结构来组织文章（用 ## 表示大标题，### 表示小标题），每个小节写2-3个充实、有例证的自然段落：

## 一、写作风格深度剖析 ##

### 1. 叙事视角与手法 ###
（分析小说的叙事视角选择、叙事技巧运用、叙事结构特点。引用具体章节为例，评价其有效性。）

### 2. 语言风格与修辞 ###
（分析用词特色、句式风格、修辞手法。指出语言的美感所在，评价作者的语言功力。）

### 3. 节奏与张力控制 ###
（分析叙事节奏的快慢变化、悬念设置与解开、张弛交替。评价阅读体验的起伏感。）

### 4. 对话与描写比例 ###
（分析对话与描写的配比关系，对话的自然度，描写的细腻程度，展示与告知的运用平衡。）

### 5. 情感基调与氛围 ###
（分析整体情感色彩、氛围营造手法、情感变化轨迹，以及这些对读者的感染力。）

## 二、主题思想深度解读 ##

### 6. 核心主题识别 ###
（识别并深入分析小说的3-5个核心主题，如成长、复仇、爱情、自由、救赎、权力、命运等。每个主题用充实的一段文字展开，引用具体情节作为证据。）

### 7. 母题与象征 ###
（分析反复出现的母题和象征元素——特定意象、物品、场景、数字、颜色等。解读它们的象征层次和在叙事中的功能。）

### 8. 思想深度与哲学内涵 ###
（探讨作品触及的深层命题：存在主义、道德困境、自由意志、人性本质等。评价作者的思想视野和作品的哲学价值。）

### 9. 价值观表达 ###
（分析作品中体现的价值观念、价值冲突的处理方式，评价其深度与复杂性。）

### 10. 社会与文化隐喻 ###
（解读作品对社会现实的映射或隐喻，分析文化元素的运用，评价其文化表达的深度。）

## 三、总结与创作建议 ##

（用1-2个充实段落总结小说的艺术特色和思想价值，给出总体的文学评价，并提出建设性的创作建议。）

【核心要求】
- 这是一篇给作者看的、有温度的文学评论，语言专业但不晦涩，分析深入但不故作高深
- 每个小节至少写2个完整自然段，确保有深度、有例证
- 好就是好，不好就是不好——给出诚实的评价
- 严格使用 ## 和 ### 作为标题标记，方便分节展示
- 正文全部用自然段落，不要出现任何列表符号、编号、或代码格式

现在开始你的深度分析：`;
  }

  async analyzeWritingStyleAndTheme(allChapters, worldState, characters, config, onChunk) {
    const prompt = this.buildDeepAnalysisPrompt(allChapters, worldState, characters);
    return await this.chatStream(
      [{ role: 'user', content: prompt }],
      0.5,
      config,
      onChunk,
      8000
    );
  }
}

export default new AIClient();
