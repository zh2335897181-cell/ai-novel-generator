import pool from '../config/database.js';
import aiClient from '../utils/aiClient.js';
import aiFunctionClient from '../utils/functionCalling.js';
import { GenerationFlow, FlowValidator, ContentAuditor, RuleEngine, FlowPhase, FlowStatus } from '../utils/flowControl.js';
import ragService from './ragService.js';

class NovelService {
  // 根据RuleEngine的验证结果过滤更新
  filterUpdatesByValidation(updates, validationResult, characters, items, locations) {
    const characterStatusMap = {};
    characters.forEach(c => { characterStatusMap[c.name] = c.status; });
    const itemStatusMap = {};
    items.forEach(i => { itemStatusMap[i.name] = i.status; });
    const locationStatusMap = {};
    locations.forEach(l => { locationStatusMap[l.name] = l.status; });

    const errorTypes = new Set(validationResult.issues.map(i => i.type));

    const validUpdates = {
      character_updates: [],
      minor_character_updates: [],
      item_updates: [],
      location_updates: [],
      world_updates: updates.world_updates || {},
      summary: updates.summary || '',
      chapter_title: updates.chapter_title || '',
      chapter_outline: updates.chapter_outline || ''
    };

    if (updates.character_updates && Array.isArray(updates.character_updates)) {
      for (const update of updates.character_updates) {
        if (errorTypes.has('character_resurrection') && characterStatusMap[update.name] === '死亡') {
          console.warn(`过滤角色复活更新: ${update.name}`);
          continue;
        }
        if (errorTypes.has('character_not_found') && !characterStatusMap[update.name]) {
          console.warn(`过滤不存在的角色更新: ${update.name}`);
          continue;
        }
        if (errorTypes.has('realm_violation')) {
          const realmIssue = validationResult.issues.find(
            i => i.type === 'realm_violation' && i.message.includes(update.name)
          );
          if (realmIssue) {
            console.warn(`过滤境界违规的角色更新: ${update.name} - ${realmIssue.message}`);
            continue;
          }
        }
        validUpdates.character_updates.push(update);
      }
    }

    if (updates.minor_character_updates && Array.isArray(updates.minor_character_updates)) {
      for (const minor of updates.minor_character_updates) {
        if (!minor.name) continue;
        validUpdates.minor_character_updates.push(minor);
      }
    }

    if (updates.item_updates && Array.isArray(updates.item_updates)) {
      for (const item of updates.item_updates) {
        if (!item.name) continue;
        // 兼容处理：is_new 可以是布尔值 true、字符串 "true" 或数字 1
        const isNewItem = item.is_new === true || item.is_new === 'true' || item.is_new === 1;
        if (errorTypes.has('item_invalid_recovery') && itemStatusMap[item.name] !== '存在' && item.status === '存在') {
          console.warn(`过滤物品非法恢复更新: ${item.name}`);
          continue;
        }
        if (errorTypes.has('item_not_found') && !itemStatusMap[item.name] && !isNewItem) {
          console.warn(`过滤不存在的物品更新: ${item.name}`);
          continue;
        }
        validUpdates.item_updates.push(item);
      }
    }

    if (updates.location_updates && Array.isArray(updates.location_updates)) {
      for (const location of updates.location_updates) {
        if (!location.name) continue;
        // 兼容处理：is_new 可以是布尔值 true、字符串 "true" 或数字 1
        const isNewLocation = location.is_new === true || location.is_new === 'true' || location.is_new === 1;
        if (errorTypes.has('location_invalid_recovery') && locationStatusMap[location.name] === '毁灭' && location.status !== '毁灭') {
          console.warn(`过滤地点非法恢复更新: ${location.name}`);
          continue;
        }
        if (errorTypes.has('location_not_found') && !locationStatusMap[location.name] && !isNewLocation) {
          console.warn(`过滤不存在的地点更新: ${location.name}`);
          continue;
        }
        validUpdates.location_updates.push(location);
      }
    }

    return validUpdates;
  }
  // 创建小说
  async createNovel(userId, title) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 创建小说
      const [result] = await conn.query(
        'INSERT INTO novel (user_id, title) VALUES (?, ?)',
        [userId, title]
      );
      const novelId = result.insertId;

      // 初始化世界设定
      await conn.query(
        'INSERT INTO world_state (novel_id, rules, background, extra) VALUES (?, ?, ?, ?)',
        [novelId, '待设定', '待设定', '{}']
      );

      // 初始化摘要
      await conn.query(
        'INSERT INTO story_summary (novel_id, summary) VALUES (?, ?)',
        [novelId, '故事刚开始']
      );

      await conn.commit();
      return novelId;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取小说列表
  async getNovelsByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM novel WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  // 根据ID获取小说基本信息
  async getNovelById(novelId) {
    const [rows] = await pool.query(
      'SELECT * FROM novel WHERE id = ?',
      [novelId]
    );
    return rows[0] || null;
  }

  // 删除小说及其所有相关数据
  async deleteNovel(novelId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 删除相关数据（按外键依赖顺序）
      await conn.query('DELETE FROM story_content WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM story_summary WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM chapter_outline WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM character_state WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM minor_character_state WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM item_state WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM location_state WHERE novel_id = ?', [novelId]);
      await conn.query('DELETE FROM world_state WHERE novel_id = ?', [novelId]);
      
      // 最后删除小说主表
      await conn.query('DELETE FROM novel WHERE id = ?', [novelId]);

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取小说详情（包含所有状态）
  async getNovelDetail(novelId) {
    const [novels] = await pool.query('SELECT * FROM novel WHERE id = ?', [novelId]);
    if (novels.length === 0) return null;

    const [worldState] = await pool.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
    const [characters] = await pool.query('SELECT * FROM character_state WHERE novel_id = ? ORDER BY id', [novelId]);
    const [minorCharacters] = await pool.query('SELECT * FROM minor_character_state WHERE novel_id = ? ORDER BY id', [novelId]);
    const [items] = await pool.query('SELECT * FROM item_state WHERE novel_id = ? ORDER BY id', [novelId]);
    const [locations] = await pool.query('SELECT * FROM location_state WHERE novel_id = ? ORDER BY id', [novelId]);
    const [summary] = await pool.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);
    const [contents] = await pool.query(
      'SELECT * FROM story_content WHERE novel_id = ? ORDER BY created_at DESC LIMIT 10',
      [novelId]
    );

    return {
      novel: novels[0],
      worldState: worldState[0] || null,
      characters: characters,
      minorCharacters: minorCharacters,
      items: items,
      locations: locations,
      summary: summary[0]?.summary || '',
      contents: contents
    };
  }

  // 添加角色
  async addCharacter(novelId, name, level = 1, attributes = {}) {
    // 确保attributes是JSON字符串
    const attrsString = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
    
    const [result] = await pool.query(
      'INSERT INTO character_state (novel_id, name, level, status, attributes) VALUES (?, ?, ?, ?, ?)',
      [novelId, name, level, '正常', attrsString]
    );
    return result.insertId;
  }

  // 更新世界设定
  async updateWorldState(novelId, rules, background, extra = {}) {
    // 从 extra 中提取 genre 和 style
    const genre = extra.genre || null;
    const style = extra.style || null;
    
    // 移除 genre 和 style，剩余的放入 extra
    const { genre: _, style: __, ...restExtra } = extra;
    const extraString = typeof restExtra === 'string' ? restExtra : JSON.stringify(restExtra);
    
    // 更新数据库，包含 genre 和 style
    await pool.query(
      'UPDATE world_state SET genre = ?, style = ?, rules = ?, background = ?, extra = ? WHERE novel_id = ?',
      [genre, style, rules, background, extraString, novelId]
    );
  }

  // 核心：生成小说
  async generateStory(novelId, userInput, aiConfig) {
    const conn = await pool.getConnection();
    try {
      // 1. 从MySQL查询所有状态
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      // 2. 调用AI生成小说
      const storyContent = await aiClient.generateStory(
        worldState[0],
        characters,
        summary[0]?.summary,
        userInput,
        aiConfig
      );

      // 3. 保存生成的内容
      await conn.query(
        'INSERT INTO story_content (novel_id, content) VALUES (?, ?)',
        [novelId, storyContent]
      );

      // 4. 调用AI提取摘要和更新
      let updates;
      try {
        updates = await aiClient.extractSummary(storyContent, worldState[0], characters, aiConfig);
      } catch (error) {
        console.error('摘要提取失败:', error);
        // 如果摘要提取失败，使用默认值
        updates = {
          character_updates: [],
          world_updates: {},
          summary: storyContent.substring(0, 200)
        };
      }

      // 5. 更新角色状态（单独更新每个角色）
      await conn.beginTransaction();
      
      if (updates.character_updates && updates.character_updates.length > 0) {
        for (const update of updates.character_updates) {
          await conn.query(
            'UPDATE character_state SET status = ?, level = ? WHERE novel_id = ? AND name = ?',
            [update.new_status, update.level, novelId, update.name]
          );
        }
      }

      // 6. 更新世界设定
      if (updates.world_updates && (updates.world_updates.rules || updates.world_updates.background)) {
        const [current] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
        await conn.query(
          'UPDATE world_state SET rules = ?, background = ? WHERE novel_id = ?',
          [
            updates.world_updates.rules || current[0].rules,
            updates.world_updates.background || current[0].background,
            novelId
          ]
        );
      }

      // 7. 更新摘要
      if (updates.summary) {
        await conn.query(
          'UPDATE story_summary SET summary = ? WHERE novel_id = ?',
          [updates.summary, novelId]
        );
      }

      await conn.commit();

      return {
        content: storyContent,
        updates: updates
      };
    } catch (error) {
      await conn.rollback();
      console.error('生成小说失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取角色列表
  async getCharacters(novelId) {
    const [rows] = await pool.query(
      'SELECT * FROM character_state WHERE novel_id = ? ORDER BY id',
      [novelId]
    );
    return rows;
  }

  // AI拆解小说大纲（新功能）
  async parseAndInitialize(novelId, outline, aiConfig) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. 调用AI解析大纲
      const parsed = await aiClient.parseNovelOutline(outline, aiConfig);

      // 2. 更新世界设定（包含类型、风格、境界系统）
      const extraString = typeof parsed.world.extra === 'string' 
        ? parsed.world.extra 
        : JSON.stringify(parsed.world.extra || {});
      
      const realmSystemString = typeof parsed.world.realm_system === 'string'
        ? parsed.world.realm_system
        : JSON.stringify(parsed.world.realm_system || {});
      
      await conn.query(
        'UPDATE world_state SET genre = ?, style = ?, rules = ?, background = ?, extra = ?, realm_system = ? WHERE novel_id = ?',
        [
          parsed.world.genre,
          parsed.world.style,
          parsed.world.rules,
          parsed.world.background,
          extraString,
          realmSystemString,
          novelId
        ]
      );

      // 3. 批量添加角色（包含境界）
      for (const char of parsed.characters) {
        const attrsString = typeof char.attributes === 'string'
          ? char.attributes
          : JSON.stringify(char.attributes || {});
        
        await conn.query(
          'INSERT INTO character_state (novel_id, name, level, realm, status, attributes) VALUES (?, ?, ?, ?, ?, ?)',
          [novelId, char.name, char.level || 1, char.realm || null, '正常', attrsString]
        );
      }

      // 4. 更新摘要
      await conn.query(
        'UPDATE story_summary SET summary = ? WHERE novel_id = ?',
        [parsed.summary, novelId]
      );

      await conn.commit();

      return parsed;
    } catch (error) {
      await conn.rollback();
      console.error('大纲解析失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // 生成章节大纲（新功能）
  async generateChapterOutlines(novelId, chapterCount, aiConfig) {
    const conn = await pool.getConnection();
    try {
      // 1. 查询当前状态（包含物品和地点）
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      // 2. 调用AI生成章节大纲（传入物品和地点）
      const result = await aiClient.generateChapterOutlines(
        worldState[0],
        characters,
        summary[0]?.summary,
        chapterCount,
        items,
        locations,
        aiConfig
      );

      // 3. 保存章节大纲
      await conn.beginTransaction();
      
      // 获取当前最大章节号
      const [maxChapter] = await conn.query(
        'SELECT COALESCE(MAX(chapter_number), 0) as max_num FROM chapter_outline WHERE novel_id = ?',
        [novelId]
      );
      const startNumber = maxChapter[0].max_num + 1;

      for (let i = 0; i < result.chapters.length; i++) {
        const chapter = result.chapters[i];
        await conn.query(
          'INSERT INTO chapter_outline (novel_id, chapter_number, title, outline, status) VALUES (?, ?, ?, ?, ?)',
          [novelId, startNumber + i, chapter.title, chapter.outline, '未开始']
        );
      }

      await conn.commit();

      return result;
    } catch (error) {
      await conn.rollback();
      console.error('章节大纲生成失败:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取章节大纲列表
  async getChapterOutlines(novelId) {
    const [rows] = await pool.query(
      'SELECT * FROM chapter_outline WHERE novel_id = ? ORDER BY chapter_number',
      [novelId]
    );
    return rows;
  }

  // 流式生成小说（带流程控制）
  async generateStoryStream(novelId, userInput, aiConfig, wordCount, res) {
    const conn = await pool.getConnection();
    const flow = new GenerationFlow(novelId, userInput, wordCount);
    const validator = new FlowValidator(flow);
    const auditor = new ContentAuditor();

    try {
      // ========== 环节1: 查询状态 ==========
      flow.startPhase(FlowPhase.INIT);

      let worldState, characters, minorCharacters, items, locations, summary;
      let nextChapterNumber;
      let previousChapterContent = ''; // 添加上一章内容变量
      let timelineEvents = []; // 添加时间线事件变量

      try {
        flow.startPhase(FlowPhase.QUERY_STATE);

        [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
        [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
        [minorCharacters] = await conn.query('SELECT * FROM minor_character_state WHERE novel_id = ?', [novelId]);
        [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
        [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
        [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

        const [maxChapter] = await conn.query(
          'SELECT COALESCE(MAX(chapter_number), 0) as max_num FROM story_content WHERE novel_id = ?',
          [novelId]
        );
        nextChapterNumber = maxChapter[0].max_num + 1;

        // 查询上一章内容用于连贯性
        if (nextChapterNumber > 1) {
          const [prevChapter] = await conn.query(
            'SELECT content FROM story_content WHERE novel_id = ? AND chapter_number = ? ORDER BY id DESC LIMIT 1',
            [novelId, nextChapterNumber - 1]
          );
          if (prevChapter.length > 0) {
            previousChapterContent = prevChapter[0].content;
          }
        }

        // 查询时间线事件用于AI生成
        [timelineEvents] = await conn.query(
          'SELECT * FROM timeline_events WHERE novel_id = ? ORDER BY event_date ASC, created_at ASC',
          [novelId]
        );

        flow.completePhase(FlowPhase.QUERY_STATE, {
          worldState: worldState[0],
          characterCount: characters.length,
          minorCharacterCount: minorCharacters.length,
          itemCount: items.length,
          locationCount: locations.length,
          nextChapterNumber
        });

        // 验证查询结果
        await validator.validate(FlowPhase.QUERY_STATE, { worldState: worldState[0], characters });

      } catch (error) {
        flow.failPhase(FlowPhase.QUERY_STATE, error);
        throw new Error(`状态查询失败: ${error.message}`);
      }

      // ========== 环节2: 流式生成小说 ==========
      flow.startPhase(FlowPhase.GENERATE_CONTENT);

      let fullContent = '';
      let currentWordCount = 0;

      // 添加生成进度跟踪
      const generationProgress = {
        startTime: Date.now(),
        lastReport: Date.now(),
        chunkCount: 0
      };

      let ragContext = '';
      try {
        ragContext = await ragService.retrieveContextForGeneration(novelId, userInput, aiConfig);
      } catch (ragErr) {
        console.warn('[RAG] 检索跳过:', ragErr.message);
      }

      try {
        await aiClient.generateStoryStream(
          worldState[0],
          characters,
          summary[0]?.summary,
          userInput,
          aiConfig,
          items,
          locations,
          minorCharacters,
          wordCount,
          (chunk) => {
            fullContent += chunk;
            currentWordCount = fullContent.length;
            generationProgress.chunkCount++;

            // 每秒报告一次进度
            const now = Date.now();
            if (now - generationProgress.lastReport > 1000) {
              generationProgress.lastReport = now;
              res.write(`data: ${JSON.stringify({
                type: 'progress',
                phase: 'generate',
                wordCount: currentWordCount,
                targetWordCount: wordCount,
                progress: Math.min(100, Math.round((currentWordCount / wordCount) * 100)),
                elapsed: now - generationProgress.startTime
              })}\n\n`);
            }

            // 发送流式数据
            res.write(`data: ${JSON.stringify({
              type: 'content',
              content: chunk,
              wordCount: currentWordCount
            })}\n\n`);
          },
          ragContext,
          previousChapterContent,
          timelineEvents // 传递时间线事件给AI
        );

        flow.completePhase(FlowPhase.GENERATE_CONTENT, {
          wordCount: fullContent.length,
          chunkCount: generationProgress.chunkCount,
          duration: Date.now() - generationProgress.startTime
        });

      } catch (error) {
        flow.failPhase(FlowPhase.GENERATE_CONTENT, error);
        throw new Error(`内容生成失败: ${error.message}`);
      }

      // ========== 环节3: 内容审查 ==========
      flow.startPhase(FlowPhase.EXTRACT_SUMMARY);
      res.write(`data: ${JSON.stringify({ type: 'generating', message: '正在分析内容...' })}\n\n`);

      let updates;
      try {
        // 内容质量审查
        const auditResult = await auditor.audit(fullContent, { wordCount });

        if (!auditResult.passed) {
          console.warn('[Auditor] 内容审查发现问题:', auditResult.issues);
          flow.metadata.auditIssues = auditResult.issues;
        }

        // 提取摘要和更新
        updates = await aiClient.extractSummary(
          fullContent,
          worldState[0],
          characters,
          items,
          locations,
          minorCharacters,
          aiConfig
        );

        flow.completePhase(FlowPhase.EXTRACT_SUMMARY, {
          hasChapterTitle: !!updates.chapter_title,
          hasChapterOutline: !!updates.chapter_outline,
          characterUpdatesCount: updates.character_updates?.length || 0,
          itemUpdatesCount: updates.item_updates?.length || 0
        });

      } catch (error) {
        console.error('[Flow] 摘要提取失败，使用默认值:', error);
        flow.failPhase(FlowPhase.EXTRACT_SUMMARY, error);
        // 使用默认值继续，不中断流程
        updates = {
          chapter_title: `第${nextChapterNumber}章`,
          chapter_outline: fullContent.substring(0, 200),
          character_updates: [],
          minor_character_updates: [],
          item_updates: [],
          location_updates: [],
          world_updates: {},
          summary: fullContent.substring(0, 200)
        };
      }

      // ========== 环节4: 验证更新 ==========
      flow.startPhase(FlowPhase.VALIDATE_UPDATES);

      const ruleEngine = new RuleEngine();
      const worldGenre = worldState[0]?.genre || '';

      try {
        const validationResult = ruleEngine.validate(
          fullContent,
          characters,
          updates,
          items,
          locations,
          worldGenre
        );

        flow.metadata.validationResult = validationResult;
        flow.metadata.skippedUpdates = validationResult.issues;
        flow.metadata.warnings = validationResult.issues.filter(i => !i.type.includes('resurrection') && !i.type.includes('recovery'));

        if (!validationResult.passed) {
          console.warn('[RuleEngine] 验证未完全通过:', validationResult.issues);
        }

        updates = this.filterUpdatesByValidation(updates, validationResult, characters, items, locations);

        // 让 FlowValidator 参与到验证阶段，避免阶段约束逻辑“定义了但未执行”
        await validator.validate(FlowPhase.VALIDATE_UPDATES, {
          validationResult,
          updates
        });

        flow.completePhase(FlowPhase.VALIDATE_UPDATES, {
          appliedRules: validationResult.appliedRules?.length || 0,
          genre: worldGenre,
          validCharacterUpdates: updates.character_updates?.length || 0,
          validMinorUpdates: updates.minor_character_updates?.length || 0,
          validItemUpdates: updates.item_updates?.length || 0,
          validLocationUpdates: updates.location_updates?.length || 0,
          skippedErrors: validationResult.issues?.length || 0
        });

      } catch (error) {
        flow.failPhase(FlowPhase.VALIDATE_UPDATES, error);
        throw new Error(`验证失败: ${error.message}`);
      }

      // ========== 环节5: 保存内容 ==========
      flow.startPhase(FlowPhase.SAVE_CONTENT);

      let savedStoryContentId = null;
      try {
        await conn.beginTransaction();

        const [insertResult] = await conn.query(
          'INSERT INTO story_content (novel_id, chapter_number, chapter_title, chapter_outline, content, word_count) VALUES (?, ?, ?, ?, ?, ?)',
          [novelId, nextChapterNumber, updates.chapter_title || `第${nextChapterNumber}章`, updates.chapter_outline || '', fullContent, fullContent.length]
        );
        savedStoryContentId = insertResult.insertId;

        flow.addRollback(async () => {
          await conn.query('DELETE FROM story_content WHERE novel_id = ? AND chapter_number = ?', [novelId, nextChapterNumber]);
        });

        flow.completePhase(FlowPhase.SAVE_CONTENT, { chapterNumber: nextChapterNumber });

      } catch (error) {
        await conn.rollback();
        flow.failPhase(FlowPhase.SAVE_CONTENT, error);
        throw new Error(`内容保存失败: ${error.message}`);
      }

      // ========== 环节6: 更新状态 ==========
      flow.startPhase(FlowPhase.UPDATE_STATE);

      try {
        // 更新主要角色
        if (updates.character_updates && updates.character_updates.length > 0) {
          for (const update of updates.character_updates) {
            await conn.query(
              'UPDATE character_state SET status = ?, level = ? WHERE novel_id = ? AND name = ?',
              [update.new_status, update.level, novelId, update.name]
            );
          }
        }

        // 更新/添加配角
        if (updates.minor_character_updates && updates.minor_character_updates.length > 0) {
          for (const minor of updates.minor_character_updates) {
            const itemsString = typeof minor.items === 'string' ? minor.items : JSON.stringify(minor.items || []);

            // 兼容处理：is_new 可以是布尔值 true、字符串 "true" 或数字 1
            const isNewMinor = minor.is_new === true || minor.is_new === 'true' || minor.is_new === 1;
            if (isNewMinor) {
              await conn.query(
                'INSERT INTO minor_character_state (novel_id, name, role, status, description, items, first_appearance, last_appearance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [novelId, minor.name, minor.role, minor.status, minor.description, itemsString, nextChapterNumber, nextChapterNumber]
              );
            } else {
              await conn.query(
                'UPDATE minor_character_state SET status = ?, description = ?, items = ?, last_appearance = ? WHERE novel_id = ? AND name = ?',
                [minor.status, minor.description, itemsString, nextChapterNumber, novelId, minor.name]
              );
            }
          }
        }

        // 更新/添加物品
        if (updates.item_updates && updates.item_updates.length > 0) {
          for (const item of updates.item_updates) {
            // 兼容处理：is_new 可以是布尔值 true、字符串 "true" 或数字 1
            const isNewItem = item.is_new === true || item.is_new === 'true' || item.is_new === 1;
            if (isNewItem) {
              await conn.query(
                'INSERT INTO item_state (novel_id, name, type, owner, status, attributes) VALUES (?, ?, ?, ?, ?, ?)',
                [novelId, item.name, item.type, item.owner, item.status, '{}']
              );
            } else {
              await conn.query(
                'UPDATE item_state SET owner = ?, status = ? WHERE novel_id = ? AND name = ?',
                [item.owner, item.status, novelId, item.name]
              );
            }
          }
        }

        // 更新/添加地点
        if (updates.location_updates && updates.location_updates.length > 0) {
          for (const location of updates.location_updates) {
            // 兼容处理：is_new 可以是布尔值 true、字符串 "true" 或数字 1
            const isNewLocation = location.is_new === true || location.is_new === 'true' || location.is_new === 1;
            if (isNewLocation) {
              await conn.query(
                'INSERT INTO location_state (novel_id, name, type, status, description, attributes) VALUES (?, ?, ?, ?, ?, ?)',
                [novelId, location.name, location.type, location.status, location.description, '{}']
              );
            } else {
              await conn.query(
                'UPDATE location_state SET status = ?, description = ? WHERE novel_id = ? AND name = ?',
                [location.status, location.description, novelId, location.name]
              );
            }
          }
        }

        // 更新世界设定
        if (updates.world_updates && (updates.world_updates.rules || updates.world_updates.background)) {
          const [current] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
          await conn.query(
            'UPDATE world_state SET rules = ?, background = ? WHERE novel_id = ?',
            [
              updates.world_updates.rules || current[0].rules,
              updates.world_updates.background || current[0].background,
              novelId
            ]
          );
        }

        // 更新摘要
        if (updates.summary) {
          await conn.query(
            'UPDATE story_summary SET summary = ? WHERE novel_id = ?',
            [updates.summary, novelId]
          );
        }

        flow.completePhase(FlowPhase.UPDATE_STATE, {
          characterUpdates: updates.character_updates?.length || 0,
          minorUpdates: updates.minor_character_updates?.length || 0,
          itemUpdates: updates.item_updates?.length || 0,
          locationUpdates: updates.location_updates?.length || 0
        });

      } catch (error) {
        await conn.rollback();
        await flow.executeRollback();
        flow.failPhase(FlowPhase.UPDATE_STATE, error);
        throw new Error(`状态更新失败: ${error.message}`);
      }

      // ========== 环节7: 提交事务 ==========
      flow.startPhase(FlowPhase.COMMIT);

      try {
        await conn.commit();
        flow.completePhase(FlowPhase.COMMIT);
      } catch (error) {
        await conn.rollback();
        await flow.executeRollback();
        flow.failPhase(FlowPhase.COMMIT, error);
        throw new Error(`事务提交失败: ${error.message}`);
      }

      // RAG：提交后索引本章与摘要（失败不影响主流程）
      if (savedStoryContentId) {
        try {
          await ragService.indexStoryChapter(
            novelId,
            savedStoryContentId,
            nextChapterNumber,
            updates.chapter_title || `第${nextChapterNumber}章`,
            fullContent,
            aiConfig
          );
        } catch (e) {
          console.warn('[RAG] 章节索引失败:', e.message);
        }
      }
      try {
        const [sumRows] = await pool.query('SELECT summary FROM story_summary WHERE novel_id = ?', [novelId]);
        if (sumRows[0]?.summary) {
          await ragService.indexSummaryChunk(novelId, sumRows[0].summary, aiConfig);
        }
      } catch (e) {
        console.warn('[RAG] 摘要索引失败:', e.message);
      }

      // ========== 完成 ==========
      flow.startPhase(FlowPhase.COMPLETE);
      flow.completePhase(FlowPhase.COMPLETE, {
        chapterNumber: nextChapterNumber,
        wordCount: fullContent.length
      });

      // 发送完成信号
      res.write(`data: ${JSON.stringify({
        type: 'done',
        updates: updates,
        wordCount: fullContent.length,
        chapterNumber: nextChapterNumber,
        flowSummary: flow.getSummary()
      })}\n\n`);
      res.end();

      console.log('[Flow] 生成流程完成:', JSON.stringify(flow.getSummary(), null, 2));

    } catch (error) {
      console.error('[Flow] 生成流程异常:', error);

      if (conn) {
        try {
          await conn.rollback();
          await flow.executeRollback();
        } catch (rollbackError) {
          console.error('[Flow] 回滚失败:', rollbackError);
        }
      }

      flow.failPhase(flow.getCurrentPhase() || FlowPhase.INIT, error);

      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message,
        flowSummary: flow.getSummary()
      })}\n\n`);
      res.end();

      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  // AI剧情建议功能
  async getPlotSuggestions(novelId, context, aiConfig) {
    try {
      const { worldState, characters, summary, lastChapter } = context || {};
      
      // 构建提示词
      const prompt = `你是一位专业的小说编剧，请根据以下信息为下一章生成5个详细的剧情建议。

## 当前世界观 ##
类型：${worldState?.genre || '未设定'}
背景：${worldState?.background || '未设定'}
规则：${worldState?.rules || '未设定'}

## 主要角色 ##
${characters?.map(c => `- ${c.name}（${c.realm || 'Lv.' + c.level}，状态：${c.status}）`).join('\n') || '暂无'}

## 当前剧情摘要 ##
${summary || '故事刚开始'}

## 上一章内容概要 ##
${lastChapter ? `第${lastChapter.chapter_number || 1}章：${lastChapter.chapter_title || '无标题'}\n${lastChapter.chapter_outline || lastChapter.content?.substring(0, 200) + '...' || '无内容'}` : '暂无'}

## 要求 ##
请生成5个详细、有趣的剧情建议，每个建议80-120字，包含：
1. 具体场景设定（时间、地点、氛围）
2. 关键冲突或事件
3. 涉及的角色和互动
4. 预期效果（悬念、情感冲击或剧情推进）

建议要承接上一章剧情，推动故事发展，避免重复已有情节。

## 输出格式 ##
直接输出5条建议，每条一行，前面加上序号：
1. 建议内容（详细描述场景、冲突、角色互动和预期效果）
2. 建议内容
...
`;

      // 调用AI生成建议
      const apiKey = aiConfig?.apiKey || process.env.AI_API_KEY;
      const baseURL = aiConfig?.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
      const model = aiConfig?.model || process.env.AI_MODEL || 'deepseek-chat';

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: '你是一位专业的小说编剧，擅长创作精彩的剧情。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `AI API错误: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // 解析建议
      const suggestions = content
        .split('\n')
        .filter(line => line.trim().match(/^\d+[.．]/))
        .map(line => line.replace(/^\d+[.．]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 5);

      // 如果解析失败，返回默认建议
      if (suggestions.length === 0) {
        return [
          '让主角遇到一个神秘商人，获得重要情报',
          '主角发现隐藏在身边的敌人，陷入危机',
          '主角突破修为瓶颈，实力大幅提升',
          '主角与重要配角重逢，揭示过去的秘密',
          '主角获得一件神秘宝物，引发新的冒险'
        ];
      }

      return suggestions;
    } catch (error) {
      console.error('生成剧情建议失败:', error);
      // 返回默认建议
      return [
        '让主角遇到一个神秘商人，获得重要情报',
        '主角发现隐藏在身边的敌人，陷入危机',
        '主角突破修为瓶颈，实力大幅提升',
        '主角与重要配角重逢，揭示过去的秘密',
        '主角获得一件神秘宝物，引发新的冒险'
      ];
    }
  }
}

export default new NovelService();
