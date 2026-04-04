import novelService from '../services/novelService.js';

class NovelController {
  // 创建小说
  async create(req, res) {
    try {
      const { title } = req.body;
      
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
      
      const userId = req.headers['user-id'] || 1; // 简化：从header获取
      const novelId = await novelService.createNovel(userId, title.trim());
      res.json({ success: true, novelId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取小说列表
  async list(req, res) {
    try {
      const userId = req.headers['user-id'] || 1;
      const novels = await novelService.getNovelsByUser(userId);
      res.json({ success: true, data: novels });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取小说详情
  async detail(req, res) {
    try {
      const { id } = req.params;
      const detail = await novelService.getNovelDetail(id);
      if (!detail) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      res.json({ success: true, data: detail });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 删除小说
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.headers['user-id'];
      
      // 验证小说存在且属于该用户
      const novel = await novelService.getNovelById(id);
      if (!novel) {
        return res.status(404).json({ success: false, message: '小说不存在' });
      }
      if (novel.user_id != userId) {
        return res.status(403).json({ success: false, message: '无权删除此小说' });
      }
      
      await novelService.deleteNovel(id);
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
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
      
      const characterId = await novelService.addCharacter(novelId, name.trim(), level, attributes);
      res.json({ success: true, characterId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新世界设定
  async updateWorld(req, res) {
    try {
      const { novelId, rules, background, extra } = req.body;
      await novelService.updateWorldState(novelId, rules, background, extra);
      res.json({ success: true });
    } catch (error) {
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

      // 设置SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      console.log('收到流式生成请求:', { novelId, userInput, wordCount });

      await novelService.generateStoryStream(novelId, userInput, aiConfig, wordCount, res);
      
    } catch (error) {
      console.error('流式生成失败:', error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  // 获取角色列表
  async getCharacters(req, res) {
    try {
      const { novelId } = req.params;
      const characters = await novelService.getCharacters(novelId);
      res.json({ success: true, data: characters });
    } catch (error) {
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

  // 生成章节大纲（新功能）
  async generateChapterOutlines(req, res) {
    try {
      const { novelId, chapterCount = 5, aiConfig } = req.body;
      
      if (!novelId) {
        return res.status(400).json({ success: false, message: '缺少novelId参数' });
      }
      
      console.log('收到章节大纲生成请求:', { novelId, chapterCount });
      
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

  // 获取章节大纲列表
  async getChapterOutlines(req, res) {
    try {
      const { novelId } = req.params;
      const outlines = await novelService.getChapterOutlines(novelId);
      res.json({ success: true, data: outlines });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
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
      
      const suggestions = await novelService.getPlotSuggestions(novelId, context, aiConfig);
      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('剧情建议生成失败:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message
      });
    }
  }
}

export default new NovelController();
