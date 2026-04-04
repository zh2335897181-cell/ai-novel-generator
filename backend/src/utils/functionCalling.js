/**
 * AI Function Calling 模块
 * 使用 OpenAI Function Calling 替代 JSON 提取，减少幻觉
 */

import axios from 'axios';

class AIFunctionClient {
  constructor() {
    this.tools = this.defineTools();
  }

  // 定义可调用的函数
  defineTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'extract_chapter_metadata',
          description: '从小说内容中提取章节元数据，用于更新数据库状态',
          parameters: {
            type: 'object',
            properties: {
              chapter_title: {
                type: 'string',
                description: '章节标题，简洁有吸引力，10字以内',
                maxLength: 10
              },
              chapter_outline: {
                type: 'string',
                description: '章节大纲，100字以内，概括核心情节',
                maxLength: 200
              },
              summary: {
                type: 'string',
                description: '200字以内的剧情摘要',
                maxLength: 400
              }
            },
            required: ['chapter_title', 'chapter_outline', 'summary']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_character_status',
          description: '更新主要角色的状态和等级',
          parameters: {
            type: 'object',
            properties: {
              updates: {
                type: 'array',
                description: '角色状态更新列表',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: '角色名，必须是已存在的主要角色'
                    },
                    new_status: {
                      type: 'string',
                      enum: ['正常', '受伤', '死亡'],
                      description: '新状态'
                    },
                    level: {
                      type: 'integer',
                      description: '当前等级',
                      minimum: 1
                    },
                    change: {
                      type: 'string',
                      description: '状态变化描述，50字以内',
                      maxLength: 100
                    }
                  },
                  required: ['name', 'new_status', 'level']
                }
              }
            },
            required: ['updates']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_minor_character',
          description: '更新或添加配角状态',
          parameters: {
            type: 'object',
            properties: {
              updates: {
                type: 'array',
                description: '配角更新列表',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: '配角名称'
                    },
                    role: {
                      type: 'string',
                      enum: ['路人', '炮灰', '店主', '守卫', '信使', '其他'],
                      description: '角色类型'
                    },
                    status: {
                      type: 'string',
                      enum: ['正常', '受伤', '死亡'],
                      description: '状态'
                    },
                    description: {
                      type: 'string',
                      description: '简短描述，50字以内',
                      maxLength: 100
                    },
                    items: {
                      type: 'array',
                      description: '持有的物品列表',
                      items: { type: 'string' }
                    },
                    is_new: {
                      type: 'boolean',
                      description: '是否为新出现的配角'
                    }
                  },
                  required: ['name', 'role', 'status', 'is_new']
                }
              }
            },
            required: ['updates']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_item',
          description: '更新或添加物品状态',
          parameters: {
            type: 'object',
            properties: {
              updates: {
                type: 'array',
                description: '物品更新列表',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: '物品名称'
                    },
                    type: {
                      type: 'string',
                      description: '物品类型（武器/道具/宝物/药品/材料）'
                    },
                    owner: {
                      type: 'string',
                      description: '持有者名称'
                    },
                    status: {
                      type: 'string',
                      enum: ['存在', '丢失', '损毁'],
                      description: '物品状态'
                    },
                    is_new: {
                      type: 'boolean',
                      description: '是否为新物品'
                    }
                  },
                  required: ['name', 'type', 'owner', 'status', 'is_new']
                }
              }
            },
            required: ['updates']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_location',
          description: '更新或添加地点状态',
          parameters: {
            type: 'object',
            properties: {
              updates: {
                type: 'array',
                description: '地点更新列表',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: '地点名称'
                    },
                    type: {
                      type: 'string',
                      description: '地点类型（城市/山脉/秘境/建筑等）'
                    },
                    status: {
                      type: 'string',
                      enum: ['正常', '封闭', '毁灭'],
                      description: '地点状态'
                    },
                    description: {
                      type: 'string',
                      description: '地点描述'
                    },
                    is_new: {
                      type: 'boolean',
                      description: '是否为新地点'
                    }
                  },
                  required: ['name', 'type', 'status', 'is_new']
                }
              }
            },
            required: ['updates']
          }
        }
      }
    ];
  }

  async callWithFunctions(messages, tools, config) {
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
          tools: tools,
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const message = response.data.choices[0]?.message;

      if (!message) {
        throw new Error('AI返回为空');
      }

      return message;
    } catch (error) {
      console.error('Function Calling失败:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'AI调用失败');
    }
  }

  // 使用Function Calling提取章节元数据
  async extractMetadata(storyContent, worldState, characters, items, locations, minorCharacters, config) {
    const characterList = characters.map(c => `${c.name}(${c.status})`).join('、') || '无';
    const itemList = items.map(i => `${i.name}(${i.status})`).join('、') || '无';
    const locationList = locations.map(l => `${l.name}(${l.status})`).join('、') || '无';
    const minorList = minorCharacters.map(m => `${m.name}(${m.role})`).join('、') || '无';

    const systemPrompt = `你是一个严谨的数据提取AI。分析小说内容时，只能提取当前数据库中已存在的元素。

【当前数据库状态】
主要角色：${characterList}
物品：${itemList}
地点：${locationList}
配角：${minorList}

【重要规则】
1. 只能更新数据库中已存在的角色
2. 死亡状态不可逆
3. 物品状态变化：存在→丢失/损毁 是可以的，丢失/损毁→存在 是不可以的
4. 输出必须符合指定的JSON Schema格式`;

    const userPrompt = `请分析以下小说内容，提取章节元数据：

${storyContent}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const result = await this.callWithFunctions(messages, [this.tools[0]], config);

      if (result.tool_calls && result.tool_calls.length > 0) {
        const functionName = result.tool_calls[0].function.name;
        const args = JSON.parse(result.tool_calls[0].function.arguments);

        if (functionName === 'extract_chapter_metadata') {
          return {
            chapter_title: args.chapter_title,
            chapter_outline: args.chapter_outline,
            summary: args.summary,
            character_updates: [],
            minor_character_updates: [],
            item_updates: [],
            location_updates: [],
            world_updates: {}
          };
        }
      }

      // 如果没有调用函数，回退到文本提取
      console.warn('[Function Calling] 未返回函数调用，回退到文本提取');
      return null;
    } catch (error) {
      console.error('[Function Calling] 提取元数据失败:', error);
      return null;
    }
  }

  // 使用Function Calling更新角色状态
  async updateCharacterStatus(storyContent, characters, config) {
    const characterList = characters.map(c => ({
      name: c.name,
      status: c.status,
      level: c.level,
      realm: c.realm || null
    }));

    const systemPrompt = `你是一个严谨的角色状态更新AI。

【角色数据库】
${JSON.stringify(characterList, null, 2)}

【重要规则】
1. 只有状态为"正常"的角色可以变为"受伤"或"死亡"
2. 只有状态为"受伤"的角色可以变为"正常"、"受伤"或"死亡"
3. 状态为"死亡"的角色不能变为任何其他状态
4. 禁止凭空创造新角色
5. 禁止改变境界等级
6. 只能更新上述列表中存在的角色`;

    const userPrompt = `分析以下小说内容，提取角色状态变化：

${storyContent}

只输出符合格式的角色更新，不要输出其他内容。`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const result = await this.callWithFunctions(messages, [this.tools[1]], config);

      if (result.tool_calls && result.tool_calls.length > 0) {
        const functionName = result.tool_calls[0].function.name;
        const args = JSON.parse(result.tool_calls[0].function.arguments);

        if (functionName === 'update_character_status') {
          return args.updates;
        }
      }

      return [];
    } catch (error) {
      console.error('[Function Calling] 更新角色状态失败:', error);
      return [];
    }
  }

  // 使用Function Calling更新物品状态
  async updateItemStatus(storyContent, items, config) {
    const itemList = items.map(i => ({
      name: i.name,
      type: i.type,
      owner: i.owner || '无主',
      status: i.status
    }));

    const systemPrompt = `你是一个严谨的物品状态更新AI。

【物品数据库】
${JSON.stringify(itemList, null, 2)}

【重要规则】
1. 物品状态只能从"存在"变为"丢失"或"损毁"
2. 物品状态不能从"丢失"或"损毁"变回"存在"
3. 物品持有者必须是数据库中已存在的角色
4. 禁止凭空创造新物品
5. 只能更新上述列表中存在的物品`;

    const userPrompt = `分析以下小说内容，提取物品状态变化：

${storyContent}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const result = await this.callWithFunctions(messages, [this.tools[3]], config);

      if (result.tool_calls && result.tool_calls.length > 0) {
        const functionName = result.tool_calls[0].function.name;
        const args = JSON.parse(result.tool_calls[0].function.arguments);

        if (functionName === 'update_item') {
          return args.updates;
        }
      }

      return [];
    } catch (error) {
      console.error('[Function Calling] 更新物品状态失败:', error);
      return [];
    }
  }

  // 综合提取：使用多个Function Calling一次提取所有数据
  async extractAllUpdates(storyContent, worldState, characters, items, locations, minorCharacters, config) {
    const systemPrompt = `你是一个严谨的数据提取AI。分析小说内容时，只能提取当前数据库中已存在的元素。

【当前数据库状态】
主要角色：${characters.map(c => `${c.name}(${c.status})`).join('、') || '无'}
物品：${items.map(i => `${i.name}(${i.status})`).join('、') || '无'}
地点：${locations.map(l => `${l.name}(${l.status})`).join('、') || '无'}
配角：${minorCharacters.map(m => `${m.name}(${m.role})`).join('、') || '无'}

【境界系统】
${worldState?.realm_system ? JSON.stringify(worldState.realm_system) : '无'}

【重要规则】
1. 死亡状态不可逆
2. 物品状态变化：存在→丢失/损毁 ✓，丢失/损毁→存在 ✗
3. 地点状态变化：正常→封闭/毁灭 ✓，封闭/毁灭→正常 ✗
4. 禁止凭空创造新的主要角色
5. 只使用上述列表中存在的元素`;

    const userPrompt = `分析以下小说内容，按顺序调用相应的函数提取数据：

1. 首先调用 extract_chapter_metadata 提取章节标题、大纲、摘要
2. 然后调用 update_character_status 更新角色状态
3. 然后调用 update_minor_character 更新配角
4. 然后调用 update_item 更新物品
5. 最后调用 update_location 更新地点

小说内容：
${storyContent}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const result = await this.callWithFunctions(messages, this.tools, config);

      if (result.tool_calls && result.tool_calls.length > 0) {
        const updates = {
          chapter_title: '',
          chapter_outline: '',
          summary: '',
          character_updates: [],
          minor_character_updates: [],
          item_updates: [],
          location_updates: [],
          world_updates: {}
        };

        for (const call of result.tool_calls) {
          const functionName = call.function.name;
          const args = JSON.parse(call.function.arguments);

          switch (functionName) {
            case 'extract_chapter_metadata':
              updates.chapter_title = args.chapter_title;
              updates.chapter_outline = args.chapter_outline;
              updates.summary = args.summary;
              break;
            case 'update_character_status':
              updates.character_updates = args.updates || [];
              break;
            case 'update_minor_character':
              updates.minor_character_updates = args.updates || [];
              break;
            case 'update_item':
              updates.item_updates = args.updates || [];
              break;
            case 'update_location':
              updates.location_updates = args.updates || [];
              break;
          }
        }

        return updates;
      }

      return null;
    } catch (error) {
      console.error('[Function Calling] 综合提取失败:', error);
      return null;
    }
  }
}

export default new AIFunctionClient();
