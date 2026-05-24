import novelService from '../services/novelService.js';
import cacheService from '../services/cacheService.js';

class NovelController {
  // 权限检查辅助方法：返回 true 表示有权限
  async _checkAccess(novelId, userId, requiredPermission = 'edit') {
    const novel = await novelService.getNovelById(novelId);
    if (!novel) return { allowed: false, status: 404, message: '小说不存在' };
    if (novel.user_id == userId) return { allowed: true };
    if (!userId) return { allowed: false, status: 403, message: '无权操作此小说' };
    const permission = await novelService.isCollaborator(novelId, userId);
    if (requiredPermission === 'view' && permission) return { allowed: true };
    if (permission === 'edit') return { allowed: true };
    return { allowed: false, status: 403, message: '无权操作此小说' };
  }

  // 创建小说
  async create(req, res) {
    try {
      const { title, category } = req.body;

      // 输入验证
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ success: false, message: '标题必须是字符串' });
      }
      if (title.trim().length === 0) {
        return res.status(400).json({ success: false, message: '标题不能为空' });
      }
      if (title.length > 100) {
        return res.status(400).json({ success: false, message: '标题长度不能超过100字' });
      }

      const userId = req.userId;
      const novelId = await novelService.createNovel(userId, title.trim(), category);
      
      // 清除用户小说列表缓存
      await cacheService.del(`novels:user:${userId}`);
      
      res.json({ success: true, novelId });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取小说列表（带缓存）
  async list(req, res) {
    try {
      const userId = req.userId;
      const { category } = req.query;
      const cacheKey = `novels:user:${userId}${category ? ':' + category : ''}`;

      // 尝试从缓存获取
      let novels = await cacheService.get(cacheKey);

      if (!novels) {
        novels = await novelService.getNovelsByUser(userId, category);
        // 缓存 5 分钟
        await cacheService.set(cacheKey, novels, 300);
      }
      
      res.json({ success: true, data: novels });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取小说详情（带缓存）
  async detail(req, res) {
    try {
      const { id } = req.params;
      
      // 尝试从缓存获取
      let detail = await cacheService.get(cacheService.patterns.NOVEL(id));
      
      if (!detail) {
        detail = await novelService.getNovelDetail(id);
        if (!detail) {
          return res.status(404).json({ success: false, message: '小说不存在' });
        }
        // 缓存 10 分钟
        await cacheService.set(cacheService.patterns.NOVEL(id), detail, 600);
      }
      
      res.json({ success: true, data: detail });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 删除小说
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const access = await this._checkAccess(id, userId, 'edit');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }

      await novelService.deleteNovel(id);
      
      // 清除该小说的所有缓存
      await cacheService.invalidateNovel(id);
      // 清除用户小说列表缓存
      await cacheService.del(`novels:user:${userId}`);
      
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 协作管理 ====================

  async getCollaborators(req, res) {
    try {
      const { novelId } = req.params;
      const access = await this._checkAccess(novelId, req.userId, 'view');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
      const collaborators = await novelService.getCollaborators(novelId);
      res.json({ success: true, data: collaborators });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addCollaborator(req, res) {
    try {
      const { novelId } = req.params;
      const { username, permission = 'edit' } = req.body;
      const userId = req.userId;

      // 只有小说所有者可以添加协作者
      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.user_id != userId) {
        return res.status(403).json({ success: false, message: '只有小说所有者可以添加协作者' });
      }

      const collaborator = await novelService.addCollaborator(novelId, username, permission, userId);
      await cacheService.del(`novels:user:${collaborator.userId}`);
      res.json({ success: true, message: '协作者已添加', data: collaborator });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async removeCollaborator(req, res) {
    try {
      const { novelId, userId: collabUserId } = req.params;
      const userId = req.userId;

      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.user_id != userId) {
        return res.status(403).json({ success: false, message: '只有小说所有者可以移除协作者' });
      }

      await novelService.removeCollaborator(novelId, collabUserId);
      await cacheService.del(`novels:user:${collabUserId}`);
      res.json({ success: true, message: '协作者已移除' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateCollaboratorPermission(req, res) {
    try {
      const { novelId, userId: collabUserId } = req.params;
      const { permission } = req.body;
      const ownerId = req.userId;

      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.user_id != ownerId) {
        return res.status(403).json({ success: false, message: '只有小说所有者可以修改权限' });
      }

      await novelService.updateCollaboratorPermission(novelId, collabUserId, permission);
      res.json({ success: true, message: '权限已更新' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 发布管理 ====================

  async publishNovel(req, res) {
    try {
      const { novelId } = req.params;
      const userId = req.userId;
      const novel = await novelService.getNovelById(novelId);
      if (!novel) return res.status(404).json({ success: false, message: '小说不存在' });
      if (novel.user_id != userId) return res.status(403).json({ success: false, message: '只有作者可以发布' });
      if (novel.status === 'blocked') return res.status(403).json({ success: false, message: '小说已被管理员拒绝，请修改后重新提交审核' });
      await novelService.publishNovel(novelId, userId);
      res.json({ success: true, message: '已发布到公共书架' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async unpublishNovel(req, res) {
    try {
      const { novelId } = req.params;
      const userId = req.userId;
      const novel = await novelService.getNovelById(novelId);
      if (!novel) return res.status(404).json({ success: false, message: '小说不存在' });
      if (novel.user_id != userId) return res.status(403).json({ success: false, message: '只有作者可以取消发布' });
      await novelService.unpublishNovel(novelId, userId);
      res.json({ success: true, message: '已取消发布' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 公开书架（无需认证）
  async getPublicNovels(req, res) {
    try {
      const { page = 1, pageSize = 20, category } = req.query;
      const data = await novelService.getPublicNovels(parseInt(page), parseInt(pageSize), category);
      res.json({ success: true, data });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getPublicNovelDetail(req, res) {
    try {
      const { novelId } = req.params;
      const data = await novelService.getPublicNovelDetail(novelId);
      if (!data) return res.status(404).json({ success: false, message: '小说不存在或未公开' });
      res.json({ success: true, data });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 添加角色
  async addCharacter(req, res) {
    try {
      const { novelId, name, level, attributes } = req.body;
      
      // 输入验证
      if (!novelId || isNaN(parseInt(novelId))) {
        return res.status(400).json({ success: false, message: 'novelId必须是有效的数字' });
      }
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ success: false, message: '角色名不能为空' });
      }
      if (name.length > 50) {
        return res.status(400).json({ success: false, message: '角色名不能超过50字' });
      }
      if (level !== undefined && (isNaN(parseInt(level)) || parseInt(level) < 1)) {
        return res.status(400).json({ success: false, message: '等级必须是正整数' });
      }

      const access = await this._checkAccess(novelId, req.userId, 'edit');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }

      const characterId = await novelService.addCharacter(novelId, name.trim(), level, attributes);
      
      // 清除角色列表缓存
      await cacheService.cacheNovelCharacters(novelId, null);
      
      res.json({ success: true, characterId });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新世界设定
  async updateWorld(req, res) {
    try {
      const { novelId, rules, background, extra } = req.body;

      const access = await this._checkAccess(novelId, req.userId, 'edit');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }

      await novelService.updateWorldState(novelId, rules, background, extra);
      
      // 清除世界观缓存
      await cacheService.cacheNovelWorld(novelId, null);
      // 清除小说详情缓存（因为包含世界观信息）
      await cacheService.del(cacheService.patterns.NOVEL(novelId));
      
      res.json({ success: true });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 生成小说（核心接口）
  async generate(req, res) {
    try {
      const { novelId, userInput, aiConfig } = req.body;

      // 验证参数
      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }
      if (!userInput) {
        return res.status(400).json({ success: false, message: '缺少userInput参数' });
      }

      // 检查小说是否被封禁
      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.status === 'blocked') {
        return res.status(403).json({ success: false, message: '该小说已被封禁，无法生成新章节' });
      }

      console.log('收到生成请求:', { novelId, userInput, hasAiConfig: !!aiConfig });

      const result = await novelService.generateStory(novelId, userInput, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('生成失败:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // 流式生成小说（新功能）
  async generateStream(req, res) {
    try {
      const { novelId, userInput, aiConfig, wordCount = 800 } = req.body;

      if (!novelId || !userInput) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
      }

      // 检查小说是否被封禁
      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: '小说不存在' })}\n\n`);
        return res.end();
      }
      if (novel.status === 'blocked') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: '该小说已被封禁，无法生成新章节' })}\n\n`);
        return res.end();
      }

      // 设置SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      console.log('收到流式生成请求:', { novelId, userInput, wordCount });

      await novelService.generateStoryStream(novelId, userInput, aiConfig, wordCount, res);

    } catch (error) {
      console.error('流式生成失败:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    }
  }

  // 获取角色列表（带缓存）
  async getCharacters(req, res) {
    try {
      const { novelId } = req.params;
      
      // 尝试从缓存获取
      let characters = await cacheService.getNovelCharacters(novelId);
      
      if (!characters) {
        characters = await novelService.getCharacters(novelId);
        await cacheService.cacheNovelCharacters(novelId, characters);
      }
      
      res.json({ success: true, data: characters });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // AI拆解大纲（新功能）
  async parseOutline(req, res) {
    try {
      const { novelId, outline, aiConfig } = req.body;
      
      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }
      if (!outline) {
        return res.status(400).json({ success: false, message: '缺少outline参数' });
      }
      
      console.log('收到大纲解析请求:', { novelId, outlineLength: outline.length });
      
      const result = await novelService.parseAndInitialize(novelId, outline, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('大纲解析失败:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // 生成章节大纲
  async generateChapterOutlines(req, res) {
    try {
      const { novelId, chapterCount = 5, chapters, aiConfig } = req.body;

      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }

      console.log('收到章节大纲生成请求:', { novelId, chapterCount, chaptersCount: chapters?.length });

      // 指定了章节列表 → 逐章生成并流式推送进度
      if (chapters && chapters.length > 0) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const sendProgress = (data) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
          await novelService.generateChapterOutlinesWithProgress(novelId, chapters, aiConfig, sendProgress);
        } catch (error) {
          sendProgress({ type: 'error', message: error.message });
        }
        res.end();
        return;
      }

      // 无章节列表 → 旧行为：一次性批量生成N章
      const result = await novelService.generateChapterOutlines(novelId, chapterCount, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('章节大纲生成失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // 重新生成单个章节大纲
  async regenerateChapterOutline(req, res) {
    try {
      const { novelId, chapterId } = req.params;
      const { aiConfig } = req.body;

      if (!novelId || !chapterId) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
      }

      const result = await novelService.regenerateSingleChapterOutline(novelId, chapterId, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('单章大纲重新生成失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取章节大纲列表
  async getChapterOutlines(req, res) {
    try {
      const { novelId } = req.params;
      const outlines = await novelService.getChapterOutlines(novelId);
      res.json({ success: true, data: outlines });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 自动生成章节目录（TOC）- 大批量时SSE流式推送进度
  async generateTOC(req, res) {
    const { novelId, chapterCount, aiConfig } = req.body;
    try {

      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }
      if (!chapterCount || chapterCount < 1 || chapterCount > 10000) {
        return res.status(400).json({ success: false, message: '章节数需在1-10000之间' });
      }

      console.log('收到TOC目录生成请求:', { novelId, chapterCount });

      // >60章使用SSE流式推送进度
      if (chapterCount > 60) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const sendProgress = (data) => {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
          const result = await novelService.generateTOC(novelId, chapterCount, aiConfig, sendProgress);
          sendProgress({ type: 'done', ...result });
        } catch (error) {
          sendProgress({ type: 'error', message: error.message });
        }
        res.end();
        return;
      }

      // ≤60章直接返回JSON
      const result = await novelService.generateTOC(novelId, chapterCount, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('TOC目录生成失败:', error);
      if (chapterCount > 60) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  // AI剧情建议（新功能）
  async getPlotSuggestions(req, res) {
    try {
      const { novelId, context, aiConfig } = req.body;
      
      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }
      
      console.log('收到剧情建议请求:', { novelId, hasContext: !!context });

      const result = await novelService.getPlotSuggestions(novelId, context, aiConfig);
      res.json({
        success: true,
        suggestions: result.suggestions,
        chapterNumber: result.chapterNumber,
        chapterTitle: result.chapterTitle
      });
    } catch (error) {
      console.error('剧情建议生成失败:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // AI角色对话生成
  async generateDialogue(req, res) {
    try {
      const { novelId } = req.params;
      const { char1Id, char2Id, sceneContext, aiConfig } = req.body;

      if (!novelId || !char1Id || !char2Id) {
        return res.status(400).json({ success: false, message: '缺少必要参数：novelId, char1Id, char2Id' });
      }

      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.status === 'blocked') {
        return res.status(403).json({ success: false, message: '该小说已被封禁' });
      }

      const access = await this._checkAccess(novelId, req.userId, 'edit');
      if (!access.allowed) {
        return res.status(access.status).json({ success: false, message: access.message });
      }

      console.log('收到角色对话生成请求:', { novelId, char1Id, char2Id, sceneContext });
      const result = await novelService.generateDialogue(novelId, char1Id, char2Id, sceneContext, aiConfig);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('角色对话生成失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 小说深度分析（SSE流式）
  async analyzeNovelDeeply(req, res) {
    try {
      const { novelId } = req.params;
      const { aiConfig } = req.body;

      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }

      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: '小说不存在' })}\n\n`);
        return res.end();
      }
      if (novel.status === 'blocked') {
        res.write(`data: ${JSON.stringify({ type: 'error', message: '该小说已被封禁' })}\n\n`);
        return res.end();
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      console.log('收到深度分析请求:', { novelId });

      const sendSSE = (data) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      };

      await novelService.analyzeNovelDeeply(novelId, aiConfig, sendSSE);

      res.end();
    } catch (error) {
      console.error('深度分析失败:', error);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      }
    }
  }

  // 删除章节
  async deleteChapter(req, res) {
    try {
      const { novelId, chapterId } = req.params;

      const novel = await novelService.getNovelById(novelId);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }

      await novelService.deleteChapter(novelId, chapterId);
      res.json({ success: true, message: '章节已删除' });
    } catch (error) {
      console.error('删除章节失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 审核状态查询 ====================

  // 获取小说的审核记录（作者查看）
  async getNovelReviews(req, res) {
    try {
      const { novelId } = req.params;
      const userId = req.userId;

      const novel = await novelService.getNovelById(novelId);
      if (!novel) return res.status(404).json({ success: false, message: '小说不存在' });
      if (novel.user_id != userId) return res.status(403).json({ success: false, message: '无权查看' });

      const access = await this._checkAccess(novelId, userId, 'view');
      if (!access.allowed) return res.status(access.status).json({ success: false, message: access.message });

      const reviews = await novelService.getNovelReviews(novelId);
      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 重新提交审核（作者修改后）
  async resubmitForReview(req, res) {
    try {
      const { novelId } = req.params;
      const userId = req.userId;

      const novel = await novelService.getNovelById(novelId);
      if (!novel) return res.status(404).json({ success: false, message: '小说不存在' });
      if (novel.user_id != userId) return res.status(403).json({ success: false, message: '只有作者可以操作' });

      // 恢复小说状态为审核中
      await novelService.resubmitNovelForReview(novelId);
      res.json({ success: true, message: '已重新提交审核' });
    } catch (error) {
      console.error(`[${req.method} ${req.path}]`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

}

export default new NovelController();
