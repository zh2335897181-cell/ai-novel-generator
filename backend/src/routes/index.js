import express from 'express';
import novelController from '../controllers/novelController.js';
import authController from '../controllers/authController.js';
import { runValidationTests, runAllTests } from '../utils/testRunner.js';

const router = express.Router();

// 认证相关路由
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authController.getMe);

// 小说相关路由
router.post('/novels', novelController.create);
router.get('/novels', novelController.list);
router.get('/novels/:id', novelController.detail);
router.delete('/novels/:id', novelController.delete);
router.post('/novels/characters', novelController.addCharacter);
router.put('/novels/world', novelController.updateWorld);
router.post('/novels/generate', novelController.generate);
router.post('/novels/generate-stream', novelController.generateStream);
router.get('/novels/:novelId/characters', novelController.getCharacters);
router.post('/novels/parse-outline', novelController.parseOutline);
router.post('/novels/chapter-outlines', novelController.generateChapterOutlines);
router.get('/novels/:novelId/chapter-outlines', novelController.getChapterOutlines);
router.post('/novels/plot-suggestions', novelController.getPlotSuggestions);

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

    const apiKey = aiConfig?.apiKey || process.env.AI_API_KEY
    const baseURL = aiConfig?.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1'
    const model = aiConfig?.model || process.env.AI_MODEL || 'deepseek-chat'

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
        max_tokens: 4000
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

    const apiKey = aiConfig?.apiKey || process.env.AI_API_KEY
    const baseURL = aiConfig?.baseURL || process.env.AI_BASE_URL || 'https://api.deepseek.com/v1'
    const model = aiConfig?.model || process.env.AI_MODEL || 'deepseek-chat'

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
        stream: true
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

export default router;
