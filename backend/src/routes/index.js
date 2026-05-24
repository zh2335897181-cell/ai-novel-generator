import express from 'express';
import novelController from '../controllers/novelController.js';
import authController from '../controllers/authController.js';
import adminController from '../controllers/adminController.js';
import * as timelineController from '../controllers/timelineController.js';
import { runValidationTests, runAllTests } from '../utils/testRunner.js';
import { resolveAIConfig } from '../utils/aiClient.js';

const router = express.Router();

// 公开书架路由
router.get('/public/bookshelf', novelController.getPublicNovels);
router.get('/public/novels/:novelId', novelController.getPublicNovelDetail);

// 公开反馈/举报提交（无需管理员权限）
router.post('/reports', (req, res) => adminController.createReport(req, res));

// 认证相关路由
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);

// 小说相关路由
router.post('/novels', novelController.create);
router.get('/novels', novelController.list);
router.get('/novels/:id', novelController.detail);
router.delete('/novels/:id', (req, res) => novelController.delete(req, res));
router.post('/novels/:novelId/publish', novelController.publishNovel);
router.post('/novels/:novelId/unpublish', novelController.unpublishNovel);
router.get('/novels/:novelId/collaborators', (req, res) => novelController.getCollaborators(req, res));
router.post('/novels/:novelId/collaborators', (req, res) => novelController.addCollaborator(req, res));
router.put('/novels/:novelId/collaborators/:userId', (req, res) => novelController.updateCollaboratorPermission(req, res));
router.delete('/novels/:novelId/collaborators/:userId', (req, res) => novelController.removeCollaborator(req, res));
router.post('/novels/characters', novelController.addCharacter);
router.put('/novels/world', novelController.updateWorld);
router.post('/novels/generate', novelController.generate);
router.post('/novels/generate-stream', novelController.generateStream);
router.get('/novels/:novelId/characters', novelController.getCharacters);
router.post('/novels/parse-outline', novelController.parseOutline);
router.post('/novels/chapter-outlines', novelController.generateChapterOutlines);
router.get('/novels/:novelId/chapter-outlines', novelController.getChapterOutlines);
router.post('/novels/:novelId/chapters/:chapterId/regenerate-outline', novelController.regenerateChapterOutline);
router.post('/novels/toc', novelController.generateTOC);
router.post('/novels/plot-suggestions', novelController.getPlotSuggestions);

// 审核状态相关路由
router.get('/novels/:novelId/reviews', (req, res) => novelController.getNovelReviews(req, res));
router.post('/novels/:novelId/resubmit-review', (req, res) => novelController.resubmitForReview(req, res));

// 角色对话相关路由
router.post('/novels/:novelId/dialogue', (req, res) => novelController.generateDialogue(req, res));

// 小说深度分析路由
router.post('/novels/:novelId/deep-analysis', (req, res) => novelController.analyzeNovelDeeply(req, res));

// 章节删除路由
router.delete('/novels/:novelId/chapters/:chapterId', (req, res) => novelController.deleteChapter(req, res));

// 测试相关路由
router.post('/tests/run', async (req, res) => {
  try {
    const results = await runAllTests();
    res.json(results);
  } catch (error) {
    console.error('测试运行失败:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/tests/run-validation', async (req, res) => {
  try {
    const results = await runValidationTests();
    res.json(results);
  } catch (error) {
    console.error('验证测试运行失败:', error);
    res.status(500).json({ message: error.message });
  }
});

// 普通 AI 聊天
router.post('/ai/chat', async (req, res) => {
  try {
    const { messages, temperature = 0.7, aiConfig } = req.body

    const { apiKey, baseURL, model } = resolveAIConfig(aiConfig)

    if (!apiKey) {
      return res.status(400).json({ message: '请先配置AI API Key' })
    }

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 4000,
        response_format: { type: 'text' }
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `AI API错误: ${response.status}`)
    }

    const data = await response.json()
    res.json({ content: data.choices[0].message.content })
  } catch (error) {
    console.error('AI聊天失败:', error.message)
    res.status(500).json({ message: error.message })
  }
})

// 流式 AI 聊天
router.post('/ai/chat-stream', async (req, res) => {
  try {
    const { messages, temperature = 0.7, aiConfig } = req.body

    const { apiKey, baseURL, model } = resolveAIConfig(aiConfig)

    if (!apiKey) {
      return res.status(400).json({ message: '请先配置AI API Key' })
    }

    // 设置SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 4000,
        stream: true,
        response_format: { type: 'text' }
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message || `AI API错误: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        res.end()
        break
      }

      const text = decoder.decode(value)
      const lines = text.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.includes('[DONE]')) continue
        if (!line.startsWith('data: ')) continue

        try {
          const data = JSON.parse(line.substring(6))
          const content = data.choices[0]?.delta?.content || ''
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`)
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  } catch (error) {
    console.error('AI流式聊天失败:', error.message)
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
})

// 时间线相关路由
router.get('/novels/:novelId/timeline', timelineController.getTimelineEvents);
router.post('/novels/:novelId/timeline', timelineController.createTimelineEvent);
router.put('/timeline/:eventId', timelineController.updateTimelineEvent);
router.delete('/timeline/:eventId', timelineController.deleteTimelineEvent);

export default router;
