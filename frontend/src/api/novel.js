const BASE = '/api'

// 获取请求头，游客模式添加标记，登录用户添加token
const getHeaders = (extraHeaders = {}) => {
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const token = localStorage.getItem('token')
  const headers = { ...extraHeaders }
  
  if (isGuest) {
    headers['x-guest-mode'] = 'true'
    headers['user-id'] = '1'
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

export default {
  async getNovels() {
    try {
      const response = await fetch(`${BASE}/novels`, {
        headers: getHeaders()
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '网络请求失败' }))
        throw new Error(errorData.message || `获取小说列表失败 (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到服务器，请检查后端服务是否启动')
      }
      throw error
    }
  },

  async createNovel(title) {
    const response = await fetch(`${BASE}/novels`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async getNovelDetail(novelId) {
    if (!novelId || isNaN(parseInt(novelId))) {
      throw new Error('无效的小说ID')
    }
    try {
      const response = await fetch(`${BASE}/novels/${novelId}`, {
        headers: getHeaders()
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '获取详情失败' }))
        if (response.status === 404) {
          throw new Error('小说不存在或已被删除')
        }
        throw new Error(errorData.message || `获取小说详情失败 (${response.status})`)
      }
      return await response.json()
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      throw error
    }
  },

  async addCharacter(novelId, name, level, attributes = {}) {
    const response = await fetch(`${BASE}/novels/characters`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, name, level, attributes })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async updateWorld(novelId, rules, background, extra = {}) {
    const response = await fetch(`${BASE}/novels/world`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, rules, background, extra })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generate(novelId, userInput, aiConfig) {
    const response = await fetch(`${BASE}/novels/generate`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, userInput, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generateStoryStream(novelId, userInput, aiConfig, wordCount, onData) {
    const response = await fetch(`${BASE}/novels/generate-stream`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, userInput, aiConfig, wordCount })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(err.message)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value)
      const lines = text.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.substring(6))
          onData(data)
        } catch (e) {
          if (e.message !== 'Unexpected end of JSON input') {
            console.error('解析SSE数据失败:', e)
          }
        }
      }
    }
  },

  async getCharacters(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}/characters`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async parseOutline(novelId, outline, aiConfig) {
    const response = await fetch(`${BASE}/novels/parse-outline`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, outline, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generateChapterOutlines(novelId, chapterCount, aiConfig) {
    const response = await fetch(`${BASE}/novels/chapter-outlines`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, chapterCount, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async getChapterOutlines(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}/chapter-outlines`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async getPlotSuggestions(novelId, context, aiConfig) {
    const response = await fetch(`${BASE}/novels/plot-suggestions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, context, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 用户登录
  async login({ username, password }) {
    const response = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '登录失败')
    return data
  },

  // 用户注册
  async register({ username, password }) {
    const response = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '注册失败')
    return data
  },

  // 获取用户信息
  async getUserInfo() {
    const response = await fetch(`${BASE}/auth/me`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 删除小说
  async deleteNovel(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // ==================== 时间线管理 API ====================

  // 获取时间线事件列表
  async getTimelineEvents(novelId) {
    const response = await fetch(`${BASE}/novels/${novelId}/timeline`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '获取时间线事件失败')
    return data
  },

  // 创建时间线事件
  async createTimelineEvent(novelId, eventData) {
    const response = await fetch(`${BASE}/novels/${novelId}/timeline`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(eventData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '创建时间线事件失败')
    return data
  },

  // 更新时间线事件
  async updateTimelineEvent(eventId, eventData) {
    const response = await fetch(`${BASE}/timeline/${eventId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(eventData)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '更新时间线事件失败')
    return data
  },

  // 删除时间线事件
  async deleteTimelineEvent(eventId) {
    const response = await fetch(`${BASE}/timeline/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '删除时间线事件失败')
    return data
  }
}