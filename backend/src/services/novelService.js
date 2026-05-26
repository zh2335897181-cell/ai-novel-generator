import pool from '../config/database.js';
import aiClient, { resolveAIConfig } from '../utils/aiClient.js';
import aiFunctionClient from '../utils/functionCalling.js';
import { GenerationFlow, FlowValidator, ContentAuditor, RuleEngine, FlowPhase, FlowStatus } from '../utils/flowControl.js';
import ragService from './ragService.js';
import sensitiveWordService from './sensitiveWordService.js';

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
  async createNovel(userId, title, category) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 创建小说
      const [result] = await conn.query(
        'INSERT INTO novel (user_id, title, category) VALUES (?, ?, ?)',
        [userId, title, category || null]
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

  // 添加协作者
  async addCollaborator(novelId, username, permission, invitedBy) {
    const conn = await pool.getConnection();
    try {
      const [[user]] = await conn.query('SELECT id FROM user WHERE username = ?', [username]);
      if (!user) throw new Error('用户不存在');
      if (user.id === invitedBy) throw new Error('不能邀请自己');
      await conn.query(
        `INSERT INTO novel_collaborator (novel_id, user_id, permission, invited_by)
         VALUES (?, ?, ?, ?)`,
        [novelId, user.id, permission, invitedBy]
      );
      return { userId: user.id, username, permission };
    } finally {
      conn.release();
    }
  }

  async removeCollaborator(novelId, userId) {
    await pool.query('DELETE FROM novel_collaborator WHERE novel_id = ? AND user_id = ?', [novelId, userId]);
  }

  async updateCollaboratorPermission(novelId, userId, permission) {
    await pool.query(
      'UPDATE novel_collaborator SET permission = ? WHERE novel_id = ? AND user_id = ?',
      [permission, novelId, userId]
    );
  }

  async getCollaborators(novelId) {
    const [rows] = await pool.query(
      `SELECT nc.*, u.username FROM novel_collaborator nc
       LEFT JOIN user u ON nc.user_id = u.id
       WHERE nc.novel_id = ?`,
      [novelId]
    );
    return rows;
  }

  async isCollaborator(novelId, userId) {
    if (!userId) return null;
    const [rows] = await pool.query(
      'SELECT permission FROM novel_collaborator WHERE novel_id = ? AND user_id = ?',
      [novelId, userId]
    );
    return rows.length > 0 ? rows[0].permission : null;
  }

  // 发布/取消发布
  async publishNovel(novelId, userId) {
    // 检查小说状态，审核中不允许发布
    const [[novel]] = await pool.query('SELECT status FROM novel WHERE id = ?', [novelId]);
    if (!novel) throw new Error('小说不存在');
    if (novel.status === 'reviewing') throw new Error('小说审核中，暂不能发布');
    if (novel.status === 'blocked') throw new Error('小说已被封禁，不能发布');

    await pool.query(
      'UPDATE novel SET is_published = 1, published_at = NOW() WHERE id = ? AND user_id = ?',
      [novelId, userId]
    );
  }

  async unpublishNovel(novelId, userId) {
    await pool.query(
      'UPDATE novel SET is_published = 0, published_at = NULL WHERE id = ? AND user_id = ?',
      [novelId, userId]
    );
  }

  async getPublicNovels(page = 1, pageSize = 20, category) {
    const offset = (page - 1) * pageSize;
    let sql = `SELECT n.id, n.title, n.category, n.is_published, n.published_at, n.created_at,
      u.username AS author_name
      FROM novel n LEFT JOIN user u ON n.user_id = u.id
      WHERE n.is_published = 1 AND n.status != 'blocked'`;
    const params = [];
    if (category) { sql += ' AND n.category = ?'; params.push(category); }
    sql += ' ORDER BY n.published_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);
    const [rows] = await pool.query(sql, params);
    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) as total FROM novel WHERE is_published = 1 AND status != 'blocked'"
    );
    return { list: rows, total };
  }

  async getPublicNovelDetail(novelId) {
    const [[novel]] = await pool.query(
      `SELECT n.id, n.title, n.category, n.is_published, n.published_at, n.created_at,
        u.username AS author_name
       FROM novel n LEFT JOIN user u ON n.user_id = u.id
       WHERE n.id = ? AND n.is_published = 1 AND n.status != 'blocked'`,
      [novelId]
    );
    if (!novel) return null;
    const [chapters] = await pool.query(
      "SELECT id, chapter_number, chapter_title, content, word_count, created_at FROM story_content WHERE novel_id = ? AND (content_type IS NULL OR content_type != 'dialogue') ORDER BY chapter_number ASC",
      [novelId]
    );
    return { novel, chapters };
  }

  // 获取小说列表（含协作小说）
  async getNovelsByUser(userId, category) {
    let sql = `SELECT DISTINCT n.*,
      (n.user_id = ?) AS is_owner,
      nc.permission AS collab_permission
      FROM novel n
      LEFT JOIN novel_collaborator nc ON nc.novel_id = n.id AND nc.user_id = ?
      WHERE n.user_id = ? OR nc.user_id = ?`;
    const params = [userId, userId, userId, userId];
    if (category) {
      sql += ' AND n.category = ?';
      params.push(category);
    }
    sql += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query(sql, params);
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
      'SELECT * FROM story_content WHERE novel_id = ? ORDER BY chapter_number ASC',
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

  // 更新小说类型和风格（AI拆解后用户确认）
  async updateGenreStyle(novelId, genre, style) {
    await pool.query(
      'UPDATE world_state SET genre = ?, style = ? WHERE novel_id = ?',
      [genre || null, style || null, novelId]
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
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ? ORDER BY id', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ? ORDER BY id', [novelId]);
      const [minorCharacters] = await conn.query('SELECT * FROM minor_character_state WHERE novel_id = ? ORDER BY id', [novelId]);
      const [timelineEvents] = await conn.query('SELECT * FROM timeline_events WHERE novel_id = ? ORDER BY event_date', [novelId]);

      // 获取上一章内容和当前章节信息
      const [lastChapter] = await conn.query(
        'SELECT content, chapter_number, chapter_title FROM story_content WHERE novel_id = ? ORDER BY created_at DESC LIMIT 1',
        [novelId]
      );
      const previousChapterContent = lastChapter.length > 0 ? lastChapter[0].content : '';
      const nextChapterNumber = lastChapter.length > 0 ? lastChapter[0].chapter_number + 1 : 1;

      // 获取当前章节大纲标题
      const [chapterOutlines] = await conn.query(
        'SELECT title FROM chapter_outline WHERE novel_id = ? AND chapter_number = ? LIMIT 1',
        [novelId, nextChapterNumber]
      );
      const chapterTitle = chapterOutlines.length > 0 ? chapterOutlines[0].title : '';

      // 2. 调用AI生成小说（传入完整上下文）
      const storyContent = await aiClient.generateStory(
        worldState[0],
        characters,
        summary[0]?.summary,
        userInput,
        aiConfig,
        items,
        locations,
        minorCharacters,
        800,
        '',
        previousChapterContent,
        timelineEvents,
        nextChapterNumber,
        chapterTitle
      );

      // 3. 敏感词过滤（无DB操作）
      const filtered = await sensitiveWordService.filterAsync(storyContent);

      // 4. 保存内容 + 审核（事务包裹）
      await conn.beginTransaction();
      const [contentResult] = await conn.query(
        'INSERT INTO story_content (novel_id, content) VALUES (?, ?)',
        [novelId, filtered]
      );

      // 自动提交到内容审核队列（使用过滤后的内容）
      try {
        const [[novelRow]] = await conn.query('SELECT user_id FROM novel WHERE id = ?', [novelId]);
        if (novelRow) {
          await conn.query("UPDATE novel SET status = 'reviewing' WHERE id = ? AND status != 'reviewing'", [novelId]);

          const [reviewResult] = await conn.query(
            'INSERT INTO content_review (content_type, content_id, novel_id, content, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['chapter', contentResult.insertId, novelId, filtered, novelRow.user_id, 'pending']
          );

          // 检查是否开启自动审核
          const [settingsRows] = await conn.query("SELECT `value` FROM system_settings WHERE `key` = 'auto_review'");
          if (settingsRows.length > 0 && (settingsRows[0].value === 'true' || settingsRows[0].value === '1')) {
            try {
              const { callAIForContentReview, parseAIReviewDecision } = await import('../utils/autoReview.js');
              const aiText = await callAIForContentReview(filtered);
              const result = parseAIReviewDecision(aiText);
              if (result.decision === 'approved' || result.decision === 'rejected') {
                await conn.query(
                  'UPDATE content_review SET status = ?, reason = ?, reviewer_id = ?, reviewed_at = NOW() WHERE id = ?',
                  [result.decision, result.reason, 0, reviewResult.insertId]
                );
                console.log(`[AutoReview] 自动审核完成: ${result.decision}, risk: ${result.riskLevel}`);
              }
            } catch (autoReviewErr) {
              console.warn('[AutoReview] AI自动审核失败，留待人工审核:', autoReviewErr.message);
            }
          }
        }
      } catch (reviewErr) {
        console.warn('[Review] 提交审核队列失败:', reviewErr.message);
      }
      await conn.commit();

      // 5. 调用AI提取摘要和更新（无DB操作，传入完整上下文）
      let updates;
      try {
        updates = await aiClient.extractSummary(storyContent, worldState[0], characters, items, locations, minorCharacters, aiConfig);
      } catch (error) {
        console.error('摘要提取失败:', error);
        updates = {
          character_updates: [],
          world_updates: {},
          summary: storyContent.substring(0, 200)
        };
      }

      // 6. 更新角色/世界/摘要状态（事务包裹）
      await conn.beginTransaction();
      if (updates.character_updates && updates.character_updates.length > 0) {
        for (const update of updates.character_updates) {
          await conn.query(
            'UPDATE character_state SET status = ?, level = ? WHERE novel_id = ? AND name = ?',
            [update.new_status, update.level, novelId, update.name]
          );
        }
      }

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
      try { await conn.rollback(); } catch (_) { /* connection may already be released */ }
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

  // 生成章节大纲
  async generateChapterOutlines(novelId, chapterCount, aiConfig, specificChapters = null) {
    const conn = await pool.getConnection();
    try {
      // 1. 查询当前状态（包含全部要素）
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
      const [minorCharacters] = await conn.query('SELECT * FROM minor_character_state WHERE novel_id = ?', [novelId]);
      const [timelineEvents] = await conn.query('SELECT * FROM timeline_events WHERE novel_id = ? ORDER BY event_date', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      // 2. 调用AI生成章节大纲
      let result;
      if (specificChapters && specificChapters.length > 0) {
        result = await aiClient.generateSpecificChapterOutlines(
          worldState[0],
          characters,
          summary[0]?.summary,
          specificChapters,
          items,
          locations,
          aiConfig
        );
      } else {
        result = await aiClient.generateChapterOutlines(
          worldState[0],
          characters,
          summary[0]?.summary,
          chapterCount,
          items,
          locations,
          minorCharacters,
          timelineEvents,
          aiConfig
        );
      }

      // 3. 保存章节大纲
      await conn.beginTransaction();

      if (specificChapters && specificChapters.length > 0) {
        // 更新指定章节的大纲（按数据库ID匹配）
        for (const chapter of result.chapters) {
          const matched = specificChapters.find(
            c => c.chapter_number === chapter.chapter_number
          );
          if (matched) {
            await conn.query(
              'UPDATE chapter_outline SET outline = ?, status = ? WHERE id = ? AND novel_id = ?',
              [chapter.outline, '未开始', matched.id, novelId]
            );
          }
        }
      } else {
        // 获取当前最大章节号，追加
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

  // 逐章生成大纲（带进度回调，用于SSE流式推送）
  async generateChapterOutlinesWithProgress(novelId, specificChapters, aiConfig, onProgress) {
    const conn = await pool.getConnection();
    try {
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      const total = specificChapters.length;
      const results = [];

      for (let i = 0; i < total; i++) {
        const chapter = specificChapters[i];
        onProgress({
          type: 'progress',
          current: i + 1,
          total,
          chapter_number: chapter.chapter_number,
          title: chapter.title
        });

        try {
          const result = await aiClient.generateSingleChapterOutline(
            worldState[0],
            characters,
            summary[0]?.summary,
            { chapter_number: chapter.chapter_number, title: chapter.title },
            items,
            locations,
            aiConfig
          );

          // 更新数据库
          await conn.query(
            'UPDATE chapter_outline SET outline = ?, status = ? WHERE id = ? AND novel_id = ?',
            [result.outline, '未开始', chapter.id, novelId]
          );

          results.push({ id: chapter.id, ...result });
        } catch (e) {
          console.error(`第${chapter.chapter_number}章大纲生成失败:`, e);
          onProgress({
            type: 'chapter_error',
            current: i + 1,
            total,
            chapter_number: chapter.chapter_number,
            title: chapter.title,
            message: e.message
          });
        }
      }

      onProgress({ type: 'done', total, results });

      return { chapters: results, total };
    } finally {
      conn.release();
    }
  }

  // 重新生成单个章节大纲
  async regenerateSingleChapterOutline(novelId, chapterId, aiConfig) {
    const conn = await pool.getConnection();
    try {
      // 1. 查询目标章节信息
      const [chapters] = await conn.query(
        'SELECT * FROM chapter_outline WHERE id = ? AND novel_id = ?',
        [chapterId, novelId]
      );
      if (chapters.length === 0) {
        throw new Error('章节不存在');
      }
      const chapter = chapters[0];

      // 2. 查询相邻章节上下文
      const [prevChapters] = await conn.query(
        'SELECT chapter_number, title, outline FROM chapter_outline WHERE novel_id = ? AND chapter_number < ? ORDER BY chapter_number DESC LIMIT 1',
        [novelId, chapter.chapter_number]
      );
      const [nextChapters] = await conn.query(
        'SELECT chapter_number, title, outline FROM chapter_outline WHERE novel_id = ? AND chapter_number > ? ORDER BY chapter_number ASC LIMIT 1',
        [novelId, chapter.chapter_number]
      );

      // 3. 查询世界观、角色等上下文
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      // 4. 构建章节信息
      const chapterInfo = {
        chapter_number: chapter.chapter_number,
        title: chapter.title,
        outline: chapter.outline,
        prevChapter: prevChapters[0] || null,
        nextChapter: nextChapters[0] || null
      };

      // 5. 调用AI重新生成
      const result = await aiClient.regenerateSingleChapterOutline(
        worldState[0],
        characters,
        summary[0]?.summary,
        chapterInfo,
        items,
        locations,
        aiConfig
      );

      // 6. 更新数据库
      await conn.query(
        'UPDATE chapter_outline SET outline = ? WHERE id = ?',
        [result.outline, chapterId]
      );

      return result;
    } catch (error) {
      console.error('单章大纲生成失败:', error);
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

  // 自动生成章节目录（TOC）- 支持大批量分批生成
  async generateTOC(novelId, chapterCount, aiConfig, onProgress) {
    const conn = await pool.getConnection();
    try {
      // 查询当前小说状态
      const [worldState] = await conn.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
      const [characters] = await conn.query('SELECT * FROM character_state WHERE novel_id = ?', [novelId]);
      const [items] = await conn.query('SELECT * FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await conn.query('SELECT * FROM location_state WHERE novel_id = ?', [novelId]);
      const [minorCharacters] = await conn.query('SELECT * FROM minor_character_state WHERE novel_id = ?', [novelId]);
      const [summary] = await conn.query('SELECT * FROM story_summary WHERE novel_id = ?', [novelId]);

      // 调用AI生成目录（支持分批）
      const result = await aiClient.generateTOC(
        worldState[0],
        characters,
        summary[0]?.summary,
        chapterCount,
        aiConfig,
        items,
        locations,
        minorCharacters,
        onProgress
      );

      // 保存目录到 chapter_outline 表（分批插入避免过长事务）
      await conn.beginTransaction();

      // 先清除该小说的旧目录
      await conn.query('DELETE FROM chapter_outline WHERE novel_id = ?', [novelId]);

      // 分批INSERT
      const INSERT_BATCH = 200;
      for (let i = 0; i < result.chapters.length; i += INSERT_BATCH) {
        const batch = result.chapters.slice(i, i + INSERT_BATCH);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
        const params = [];
        batch.forEach(ch => {
          params.push(novelId, ch.chapter_number, ch.title, '', '未开始');
        });
        await conn.query(
          `INSERT INTO chapter_outline (novel_id, chapter_number, title, outline, status) VALUES ${placeholders}`,
          params
        );
      }

      await conn.commit();

      return {
        chapters: result.chapters.slice(0, 10), // 返回前10章预览
        totalChapters: result.chapters.length,
        volumes: result.volumes || []
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
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
      let chapterTitle = ''; // 从TOC目录读取的本章标题

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

        // 查询本章在TOC目录中的标题
        const [chapterOutline] = await conn.query(
          'SELECT title FROM chapter_outline WHERE novel_id = ? AND chapter_number = ? LIMIT 1',
          [novelId, nextChapterNumber]
        );
        if (chapterOutline.length > 0) {
          chapterTitle = chapterOutline[0].title;
        }

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
          timelineEvents, // 传递时间线事件给AI
          nextChapterNumber,
          chapterTitle // 传递本章在TOC中的标题
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
          chapter_title: chapterTitle || `第${nextChapterNumber}章`,
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

        const { filtered } = await sensitiveWordService.filterAsync(fullContent);

        // 章节标题优先级：TOC目录标题 > AI提取的标题(非默认) > "第X章"
        const finalChapterTitle = chapterTitle
          || (updates.chapter_title && updates.chapter_title !== '未命名章节' ? updates.chapter_title : null)
          || `第${nextChapterNumber}章`;
        updates.chapter_title = finalChapterTitle;

        const [insertResult] = await conn.query(
          'INSERT INTO story_content (novel_id, chapter_number, chapter_title, chapter_outline, content, word_count) VALUES (?, ?, ?, ?, ?, ?)',
          [novelId, nextChapterNumber, finalChapterTitle, updates.chapter_outline || '', filtered, filtered.length]
        );
        savedStoryContentId = insertResult.insertId;

        // 自动提交到内容审核队列
        try {
          const [[novelRow]] = await conn.query('SELECT user_id FROM novel WHERE id = ?', [novelId]);
          if (novelRow) {
            // 设置小说状态为审核中
            await conn.query("UPDATE novel SET status = 'reviewing' WHERE id = ? AND status != 'reviewing'", [novelId]);

            const [reviewResult] = await conn.query(
              'INSERT INTO content_review (content_type, content_id, novel_id, content, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
              ['chapter', savedStoryContentId, novelId, filtered, novelRow.user_id, 'pending']
            );

            // 检查是否开启自动审核
            const [settingsRows] = await conn.query("SELECT `value` FROM system_settings WHERE `key` = 'auto_review'");
            if (settingsRows.length > 0 && (settingsRows[0].value === 'true' || settingsRows[0].value === '1')) {
              try {
                const { callAIForContentReview, parseAIReviewDecision } = await import('../utils/autoReview.js');
                const aiText = await callAIForContentReview(filtered);
                const result = parseAIReviewDecision(aiText);
                if (result.decision === 'approved' || result.decision === 'rejected') {
                  await conn.query(
                    'UPDATE content_review SET status = ?, reason = ?, reviewer_id = ?, reviewed_at = NOW() WHERE id = ?',
                    [result.decision, result.reason, 0, reviewResult.insertId]
                  );
                  console.log(`[AutoReview] 自动审核完成(stream): ${result.decision}, risk: ${result.riskLevel}`);
                }
              } catch (autoReviewErr) {
                console.warn('[AutoReview] AI自动审核失败，留待人工审核:', autoReviewErr.message);
              }
            }
          }
        } catch (reviewErr) {
          console.warn('[Review] 提交审核队列失败:', reviewErr.message);
        }

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

      const isNew = (obj) => obj.is_new === true || obj.is_new === 'true' || obj.is_new === 1;

      try {
        // 更新主要角色（批量 CASE WHEN）
        const charUpdates = updates.character_updates || [];
        if (charUpdates.length > 0) {
          const names = charUpdates.map(u => u.name);
          const caseStatus = charUpdates.map(u => `WHEN name = ? THEN ?`).join(' ');
          const caseLevel = charUpdates.map(u => `WHEN name = ? THEN ?`).join(' ');
          const params = [];
          charUpdates.forEach(u => { params.push(u.name, u.new_status); });
          charUpdates.forEach(u => { params.push(u.name, u.level); });
          await conn.query(
            `UPDATE character_state SET status = CASE ${caseStatus} END, level = CASE ${caseLevel} END WHERE novel_id = ? AND name IN (${names.map(() => '?').join(',')})`,
            [...params, novelId, ...names]
          );
        }

        // 更新/添加配角（批量）
        const minorUpdates = updates.minor_character_updates || [];
        const newMinors = minorUpdates.filter(m => isNew(m));
        const existingMinors = minorUpdates.filter(m => !isNew(m));
        if (newMinors.length > 0) {
          const placeholders = newMinors.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
          const params = [];
          newMinors.forEach(m => {
            const itemsStr = typeof m.items === 'string' ? m.items : JSON.stringify(m.items || []);
            params.push(novelId, m.name, m.role, m.status, m.description, itemsStr, nextChapterNumber, nextChapterNumber);
          });
          await conn.query(
            `INSERT INTO minor_character_state (novel_id, name, role, status, description, items, first_appearance, last_appearance) VALUES ${placeholders}`,
            params
          );
        }
        for (const minor of existingMinors) {
          const itemsString = typeof minor.items === 'string' ? minor.items : JSON.stringify(minor.items || []);
          await conn.query(
            'UPDATE minor_character_state SET status = ?, description = ?, items = ?, last_appearance = ? WHERE novel_id = ? AND name = ?',
            [minor.status, minor.description, itemsString, nextChapterNumber, novelId, minor.name]
          );
        }

        // 更新/添加物品（批量）
        const itemUpdates = updates.item_updates || [];
        const newItems = itemUpdates.filter(i => isNew(i));
        const existingItems = itemUpdates.filter(i => !isNew(i));
        if (newItems.length > 0) {
          const placeholders = newItems.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
          const params = [];
          newItems.forEach(i => { params.push(novelId, i.name, i.type, i.owner, i.status, '{}'); });
          await conn.query(
            `INSERT INTO item_state (novel_id, name, type, owner, status, attributes) VALUES ${placeholders}`,
            params
          );
        }
        for (const item of existingItems) {
          await conn.query(
            'UPDATE item_state SET owner = ?, status = ? WHERE novel_id = ? AND name = ?',
            [item.owner, item.status, novelId, item.name]
          );
        }

        // 更新/添加地点（批量）
        const locationUpdates = updates.location_updates || [];
        const newLocations = locationUpdates.filter(l => isNew(l));
        const existingLocations = locationUpdates.filter(l => !isNew(l));
        if (newLocations.length > 0) {
          const placeholders = newLocations.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
          const params = [];
          newLocations.forEach(l => { params.push(novelId, l.name, l.type, l.status, l.description, '{}'); });
          await conn.query(
            `INSERT INTO location_state (novel_id, name, type, status, description, attributes) VALUES ${placeholders}`,
            params
          );
        }
        for (const location of existingLocations) {
          await conn.query(
            'UPDATE location_state SET status = ?, description = ? WHERE novel_id = ? AND name = ?',
            [location.status, location.description, novelId, location.name]
          );
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
            finalChapterTitle,
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

      // 获取下一章编号
      const [maxChapter] = await pool.query(
        'SELECT COALESCE(MAX(chapter_number), 0) as max_num FROM story_content WHERE novel_id = ?',
        [novelId]
      );
      const nextChapterNumber = maxChapter[0].max_num + 1;

      // 查询下一章在TOC中的标题
      const [tocRow] = await pool.query(
        'SELECT title FROM chapter_outline WHERE novel_id = ? AND chapter_number = ? LIMIT 1',
        [novelId, nextChapterNumber]
      );
      const nextChapterTitle = tocRow.length > 0 ? tocRow[0].title : '';

      // 查询物品、地点、配角、时间线
      const [items] = await pool.query('SELECT name, type, owner, status FROM item_state WHERE novel_id = ?', [novelId]);
      const [locations] = await pool.query('SELECT name, type, status, description FROM location_state WHERE novel_id = ?', [novelId]);
      const [minorCharacters] = await pool.query('SELECT name, role, status FROM minor_character_state WHERE novel_id = ?', [novelId]);
      const [timelineEvents] = await pool.query('SELECT title, event_date, type, description, related_chapter FROM timeline_events WHERE novel_id = ? ORDER BY event_date', [novelId]);

      console.log('[PlotSuggestions] 下一章:', nextChapterNumber, 'TOC标题:', nextChapterTitle || '(无)');

      // 获取上一章信息
      const lastChapterInfo = lastChapter
        ? `第${lastChapter.chapter_number || 1}章：${lastChapter.chapter_title || '无标题'}\n概要：${lastChapter.chapter_outline || lastChapter.content?.substring(0, 200) + '...' || '无内容'}`
        : '暂无（故事刚开始）';

      // 有TOC标题时：以标题为核心驱动建议
      // 无TOC标题时：传统自由建议模式
      const systemPrompt = nextChapterTitle
        ? `你是小说剧情策划。本书下一章目录已定为《${nextChapterTitle}》。你的唯一任务是：为这一章构思5个具体场景/切入角度，直接实现这个标题所暗示的剧情。忽略其他干扰信息，紧扣标题。`
        : '你是一位专业的小说编剧，擅长构思精彩的剧情转折和冲突。回答简洁有力。';

      // 资源摘要
      const itemSummary = items.map(i => `${i.name}(${i.type||'?'}/${i.owner||'无主'})`).join('、') || '暂无';
      const locSummary = locations.map(l => l.name).join('、') || '暂无';
      const minorSummary = minorCharacters.map(m => `${m.name}(${m.role||'?'})`).join('、') || '暂无';
      const tlSummary = timelineEvents.slice(-5).map(e => `${e.title}(${e.type})`).join(' → ') || '暂无';

      const prompt = nextChapterTitle
        ? `## 任务 ##
为第${nextChapterNumber}章《${nextChapterTitle}》构思5个具体的剧情展开方案。

## 章节标题解读 ##
标题"${nextChapterTitle}"暗示了本章的核心内容。请围绕这个标题，给出5种不同的写法方案。

## 小说背景（仅供参考，以标题为准） ##
类型：${worldState?.genre || '未设定'}
世界观：${worldState?.background || '未设定'}
规则：${worldState?.rules || '未设定'}
角色：${characters?.map(c => `${c.name}(${c.realm || 'Lv.' + c.level})`).join('、') || '暂无'}
配角：${minorSummary}
可用物品：${itemSummary}
可用地点：${locSummary}
时间线：${tlSummary}
前情：${summary || '故事刚开始'}
承接：${lastChapterInfo}

## 要求 ##
- 5个方案都要直接服务于标题《${nextChapterTitle}》
- 每个方案20-40字，一句话点明本章的核心情节
- 注意利用可用物品和地点增加场景具体性
- 5个方案给出5种不同切入角度

## 输出格式 ##
1. 方案一
2. 方案二
3. 方案三
4. 方案四
5. 方案五`
        : `请基于已有剧情，为**下一章**提供5个不同方向的剧情走向建议。

## 下一章：第${nextChapterNumber}章（暂无目录标题，自由发挥） ##

## 世界观 ##
类型：${worldState?.genre || '未设定'}
背景：${worldState?.background || '未设定'}
规则：${worldState?.rules || '未设定'}

## 主要角色 ##
${characters?.map(c => `- ${c.name}（${c.realm || 'Lv.' + c.level}，状态：${c.status}）`).join('\n') || '暂无'}

## 配角 ##
${minorSummary}

## 可用物品 ##
${itemSummary}

## 可用地点 ##
${locSummary}

## 时间线 ##
${tlSummary}

## 当前剧情摘要 ##
${summary || '故事刚开始'}

## 上一章结尾 ##
${lastChapterInfo}

## 要求 ##
- 每个建议30-60字
- 结合可用物品/地点给出具体场景建议
- 不要写分章节结构

## 输出格式 ##
直接输出5行，每行格式：序号. 建议内容
1. 建议一
2. 建议二
3. 建议三
4. 建议四
5. 建议五`;

      // 调用AI生成建议
      const content = await aiClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        0.9,
        aiConfig,
        600
      );

      // 解析建议
      const suggestions = content
        .split('\n')
        .filter(line => line.trim().match(/^\d+[.．]/))
        .map(line => line.replace(/^\d+[.．]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 5);

      if (suggestions.length === 0) {
        throw new Error('AI返回的建议格式不正确');
      }

      return { suggestions, chapterNumber: nextChapterNumber, chapterTitle: nextChapterTitle };
    } catch (error) {
      console.error('生成剧情建议失败:', error);
      throw error;
    }
  }

  // AI角色对话生成
  async generateDialogue(novelId, char1Id, char2Id, sceneContext, aiConfig) {
    const [novel] = await pool.query('SELECT * FROM novel WHERE id = ?', [novelId]);
    if (novel.length === 0) throw new Error('小说不存在');

    const [char1] = await pool.query('SELECT * FROM character_state WHERE id = ? AND novel_id = ?', [char1Id, novelId]);
    const [char2] = await pool.query('SELECT * FROM character_state WHERE id = ? AND novel_id = ?', [char2Id, novelId]);
    if (char1.length === 0 || char2.length === 0) throw new Error('角色不存在');

    const [worldState] = await pool.query('SELECT * FROM world_state WHERE novel_id = ?', [novelId]);
    const [chapters] = await pool.query(
      'SELECT chapter_title, content FROM story_content WHERE novel_id = ? ORDER BY created_at DESC LIMIT 3',
      [novelId]
    );
    const [items] = await pool.query('SELECT name, type, owner, status FROM item_state WHERE novel_id = ?', [novelId]);
    const [locations] = await pool.query('SELECT name, type, status FROM location_state WHERE novel_id = ?', [novelId]);
    const [otherChars] = await pool.query('SELECT name, role, status FROM minor_character_state WHERE novel_id = ?', [novelId]);

    const recentStory = chapters.map(c => c.chapter_title + '\n' + (c.content || '').slice(0, 500)).join('\n---\n');
    const itemCtx = items.map(i => `${i.name}(${i.owner||'无主'}/${i.status})`).join('、') || '暂无';
    const locCtx = locations.map(l => l.name).join('、') || '暂无';
    const otherCtx = otherChars.map(c => `${c.name}(${c.role||''})`).join('、') || '暂无';

    const systemPrompt = `你是一位擅长写人物对话的剧作家。你笔下的对话让读者忘记是在看文字，而是仿佛能听到角色的声音、看到他们的表情。

## 【对话创作原则】 ##
1. **真实感第一**：每个人物说话方式不同——有人直率、有人迂回、有人寡言、有人唠叨。让对话听起来像"真人在说话"，而不是"角色在念台词"
2. **潜台词与弦外之音**：真正想说的话往往不在字面上。用沉默、转移话题、答非所问来展现人物的内心矛盾
3. **对话即行动**：每句对话都应该推进剧情、揭示性格、或者改变人物关系。不要为了凑字数而写废话
4. **情感藏在细节里**：一个颤抖的声音、一次躲避的眼神、握紧的拳头、长久的沉默——这些比说"我很愤怒"有力一百倍
5. **节奏与张力**：紧张时对话短促激烈，温情时对话舒缓，让对话有自己的韵律
6. **穿插动作与场景**：在对话中自然地插入人物的小动作、表情变化、周围环境的变化，让读者有身临其境之感
7. **避免说教和解释**：不要让人物说出"你应该知道……"或者大段的道理说教，真实的人不这样说话`;

    const userPrompt = `请为以下两个角色创作一段生动的对话：

小说：${novel[0].title}
小说类型：${worldState[0]?.genre || '未知'}
写作风格：${worldState[0]?.style || '未知'}

角色一：${char1[0].name}
- 等级：${char1[0].level}
- 状态：${char1[0].status}
- 属性：${typeof char1[0].attributes === 'string' ? char1[0].attributes : JSON.stringify(char1[0].attributes || {})}
${char1[0].realm ? `- 境界：${char1[0].realm}` : ''}

角色二：${char2[0].name}
- 等级：${char2[0].level}
- 状态：${char2[0].status}
- 属性：${typeof char2[0].attributes === 'string' ? char2[0].attributes : JSON.stringify(char2[0].attributes || {})}
${char2[0].realm ? `- 境界：${char2[0].realm}` : ''}

对话场景：${sceneContext || '日常相遇'}

可用物品：${itemCtx}
可选地点：${locCtx}
在场其他角色：${otherCtx}

近期故事情节参考：
${recentStory || '故事刚开始'}

## 【创作方向】 ##
- 思考这两个角色此刻各自想要什么？他们之间有什么矛盾或羁绊？
- 对话中要有情绪的起伏——可以从平静到激动，从对抗到理解，从冷漠到关切
- 加入符合场景的肢体语言和细微表情
- 让读者能感受到角色之间的关系张力

请创作这段对话：`;

    const dialogue = await aiClient.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.8, aiConfig);

    // 保存到数据库
    const [chaptersForNum] = await pool.query(
      'SELECT COALESCE(MAX(chapter_number), 0) + 1 as next_num FROM story_content WHERE novel_id = ?',
      [novelId]
    );
    const nextChapterNum = chaptersForNum[0].next_num;

    const { filtered } = await sensitiveWordService.filterAsync(dialogue);

    const title = `【对话】${char1[0].name} & ${char2[0].name} - ${sceneContext || '日常'}（第${nextChapterNum}章）`;
    await pool.query(
      `INSERT INTO story_content (novel_id, chapter_number, chapter_title, content, content_type, word_count, created_at)
       VALUES (?, ?, ?, ?, 'dialogue', ?, NOW())`,
      [novelId, nextChapterNum, title, filtered, filtered.length]
    );

    return { chapter_number: nextChapterNum, title, content: filtered, word_count: filtered.length };
  }

  // 删除章节
  async deleteChapter(novelId, chapterId) {
    const conn = await pool.getConnection();
    try {
      const [[chapter]] = await conn.query(
        'SELECT id, chapter_number FROM story_content WHERE id = ? AND novel_id = ?',
        [chapterId, novelId]
      );
      if (!chapter) {
        throw new Error('章节不存在或不属于该小说');
      }

      await conn.query(
        'DELETE FROM story_content WHERE id = ? AND novel_id = ?',
        [chapterId, novelId]
      );

      // 同步删除 RAG 分块
      await conn.query(
        'DELETE FROM rag_chunk WHERE source_id = ? AND source_type = ?',
        [chapterId, 'story']
      );

      // 清理关联的审核记录和时间线事件
      await conn.query(
        'DELETE FROM content_review WHERE content_id = ? AND content_type = ?',
        [chapterId, 'chapter']
      );
      await conn.query(
        'DELETE FROM timeline_events WHERE related_chapter = ?',
        [chapter.chapter_number]
      );
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }

  // 获取小说审核记录
  async getNovelReviews(novelId) {
    const [reviews] = await pool.query(
      `SELECT cr.*, u.username as reviewer_name
       FROM content_review cr
       LEFT JOIN user u ON cr.reviewer_id = u.id
       WHERE cr.novel_id = ?
       ORDER BY cr.created_at DESC`,
      [novelId]
    );
    return reviews;
  }

  // 小说深度分析
  async analyzeNovelDeeply(novelId, aiConfig, sendSSE) {
    // 1. 查询所有章节内容
    const [chapters] = await pool.query(
      `SELECT chapter_number, chapter_title, content FROM story_content
       WHERE novel_id = ? AND content_type != 'dialogue'
       ORDER BY chapter_number ASC`,
      [novelId]
    );

    if (!chapters.length) {
      sendSSE({ type: 'error', message: '小说暂无内容，请先生成章节后再进行分析' });
      return;
    }

    // 2. 查询世界设定
    const [worldState] = await pool.query(
      'SELECT * FROM world_state WHERE novel_id = ?',
      [novelId]
    );

    // 3. 查询角色列表
    const [characters] = await pool.query(
      'SELECT * FROM character_state WHERE novel_id = ? ORDER BY id',
      [novelId]
    );

    // 4. Phase: 准备阶段
    sendSSE({ type: 'phase', phase: 'prepare', message: `正在收集小说全部内容（共${chapters.length}章）...` });

    let fullResponse = '';

    // 5. Phase: 分析阶段
    sendSSE({ type: 'phase', phase: 'writing_style', message: '正在深度分析写作风格与主题思想...' });

    try {
      fullResponse = await aiClient.analyzeWritingStyleAndTheme(
        chapters,
        worldState[0] || {},
        characters,
        aiConfig,
        (chunk) => {
          sendSSE({ type: 'content', content: chunk });
        }
      );
    } catch (error) {
      sendSSE({ type: 'error', message: 'AI分析失败：' + error.message });
      return;
    }

    // 6. Phase: 整合报告
    sendSSE({ type: 'phase', phase: 'finalize', message: '正在整合分析报告...' });

    // 7. 发送完成事件（AI返回的是纯文本文学评论，直接传给前端）
    if (!fullResponse.trim()) {
      sendSSE({ type: 'error', message: 'AI未返回分析内容，请重试' });
      return;
    }

    sendSSE({ type: 'done', data: fullResponse });
  }

  // 重新提交小说审核
  async resubmitNovelForReview(novelId) {
    const conn = await pool.getConnection();
    try {
      // 恢复小说状态
      await conn.query(
        "UPDATE novel SET status = 'active' WHERE id = ? AND status = 'blocked'",
        [novelId]
      );
      // 获取最近被拒绝的章节并重新提交
      const [rejectedChapters] = await conn.query(
        "SELECT id, content FROM story_content WHERE novel_id = ? AND review_status = 'rejected'",
        [novelId]
      );
      for (const ch of rejectedChapters) {
        await conn.query(
          "UPDATE story_content SET review_status = 'pending', review_reason = NULL WHERE id = ?",
          [ch.id]
        );
        const [[novelRow]] = await conn.query('SELECT user_id FROM novel WHERE id = ?', [novelId]);
        await conn.query(
          "INSERT INTO content_review (content_type, content_id, novel_id, content, user_id, status) VALUES (?, ?, ?, ?, ?, ?)",
          ['chapter', ch.id, novelId, ch.content, novelRow.user_id, 'pending']
        );
      }
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

export default new NovelService();
