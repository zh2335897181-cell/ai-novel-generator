const BASE = '/api'

// 获取请求头，游客模式添加标记，登录用户添加token
const getHeaders = (extraHeaders = {}) => {
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const token = localStorage.getItem('token')
  const headers = { ...extraHeaders }

  if (isGuest) {
    headers['x-guest-mode'] = 'true'
    const guestToken = localStorage.getItem('guestToken')
    if (guestToken) {
      headers['x-guest-token'] = guestToken
    }
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// 包装fetch，自动捕获并存储游客token
const authFetch = async (url, options = {}) => {
  const response = await fetch(url, options)

  // 捕获服务端返回的游客token
  const guestToken = response.headers.get('x-guest-token')
  if (guestToken) {
    localStorage.setItem('guestToken', guestToken)
  }

  return response
}

export default {
  async getNovels(category) {
    try {
      const url = category ? `${BASE}/novels?category=${encodeURIComponent(category)}` : `${BASE}/novels`
      const response = await authFetch(url, {
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

  async createNovel(title, category) {
    const response = await authFetch(`${BASE}/novels`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, category })
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
      const response = await authFetch(`${BASE}/novels/${novelId}`, {
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
    const response = await authFetch(`${BASE}/novels/characters`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, name, level, attributes })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async updateWorld(novelId, rules, background, extra = {}) {
    const response = await authFetch(`${BASE}/novels/world`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, rules, background, extra })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generate(novelId, userInput, aiConfig) {
    const response = await authFetch(`${BASE}/novels/generate`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, userInput, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generateStoryStream(novelId, userInput, aiConfig, wordCount, onData) {
    const response = await authFetch(`${BASE}/novels/generate-stream`, {
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
    const response = await authFetch(`${BASE}/novels/${novelId}/characters`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async parseOutline(novelId, outline, aiConfig) {
    const response = await authFetch(`${BASE}/novels/parse-outline`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, outline, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generateChapterOutlines(novelId, chapterCount, aiConfig, chapters = null) {
    const response = await authFetch(`${BASE}/novels/chapter-outlines`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, chapterCount, aiConfig, chapters })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 流式生成章节大纲（逐章生成，推送进度）
  async generateChapterOutlinesStream(novelId, chapters, aiConfig, onProgress) {
    const response = await authFetch(`${BASE}/novels/chapter-outlines`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, chapterCount: chapters.length, chapters, aiConfig })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(err.message)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.substring(6))
          onProgress(data)
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  },

  async getChapterOutlines(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/chapter-outlines`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async regenerateChapterOutline(novelId, chapterId, aiConfig) {
    const response = await authFetch(`${BASE}/novels/${novelId}/chapters/${chapterId}/regenerate-outline`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  async generateTOC(novelId, chapterCount, aiConfig) {
    const response = await authFetch(`${BASE}/novels/toc`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, chapterCount, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 流式生成TOC（大批量时使用，返回进度）
  async generateTOCStream(novelId, chapterCount, aiConfig, onProgress) {
    const response = await authFetch(`${BASE}/novels/toc`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, chapterCount, aiConfig })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(err.message)
    }

    // 如果返回的是普通JSON（小批量），直接解析
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await response.json()
      onProgress({ type: 'planning', message: '正在生成...' })
      onProgress({ type: 'done', ...data.data })
      return data
    }

    // SSE流式读取
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const data = JSON.parse(line.substring(6))
          onProgress(data)
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  },

  async getPlotSuggestions(novelId, context, aiConfig) {
    const response = await authFetch(`${BASE}/novels/plot-suggestions`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ novelId, context, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 用户登录
  async login({ username, password, adminCode, deviceId, deviceName }) {
    const response = await authFetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, adminCode, deviceId, deviceName })
    })
    const data = await response.json()
    if (!response.ok) throw { message: data.message || '登录失败', requireAdminCode: data.requireAdminCode, code: response.status }
    return data
  },

  // 用户注册
  async register({ username, password, inviteCode }) {
    const response = await authFetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, inviteCode })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '注册失败')
    return data
  },

  // 获取用户信息
  async getUserInfo() {
    const response = await authFetch(`${BASE}/auth/me`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },

  // 删除小说
  async deleteNovel(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除失败')
    return data
  },

  // ==================== 发布管理 API ====================

  async publishNovel(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/publish`, {
      method: 'POST',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '发布失败')
    return data
  },

  async unpublishNovel(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/unpublish`, {
      method: 'POST',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '取消发布失败')
    return data
  },

  async getPublicNovels(params = {}) {
    const clean = {}
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') clean[k] = v
    }
    const query = new URLSearchParams(clean).toString()
    const response = await authFetch(`${BASE}/public/bookshelf?${query}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取书架失败')
    return data
  },

  async getPublicNovelDetail(novelId) {
    const response = await authFetch(`${BASE}/public/novels/${novelId}`)
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取小说详情失败')
    return data
  },

  // ==================== 协作管理 API ====================

  async getCollaborators(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/collaborators`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取协作者失败')
    return data
  },

  async addCollaborator(novelId, username, permission) {
    const response = await authFetch(`${BASE}/novels/${novelId}/collaborators`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username, permission })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '添加协作者失败')
    return data
  },

  async removeCollaborator(novelId, userId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/collaborators/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '移除协作者失败')
    return data
  },

  async updateCollaboratorPermission(novelId, userId, permission) {
    const response = await authFetch(`${BASE}/novels/${novelId}/collaborators/${userId}`, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ permission })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '更新权限失败')
    return data
  },

  // ==================== 时间线管理 API ====================

  // 获取时间线事件列表
  async getTimelineEvents(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/timeline`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '获取时间线事件失败')
    return data
  },

  // 创建时间线事件
  async createTimelineEvent(novelId, eventData) {
    const response = await authFetch(`${BASE}/novels/${novelId}/timeline`, {
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
    const response = await authFetch(`${BASE}/timeline/${eventId}`, {
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
    const response = await authFetch(`${BASE}/timeline/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || '删除时间线事件失败')
    return data
  },

  // ==================== 审核管理 ====================

  async getNovelReviews(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/reviews`, {
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '获取审核记录失败')
    return data
  },

  async resubmitForReview(novelId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/resubmit-review`, {
      method: 'POST',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '重新提交失败')
    return data
  },

  // ==================== AI 角色对话 ====================

  async generateDialogue(novelId, char1Id, char2Id, sceneContext, aiConfig) {
    const response = await authFetch(`${BASE}/novels/${novelId}/dialogue`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ char1Id, char2Id, sceneContext, aiConfig })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '对话生成失败')
    return data
  },

  // ==================== 章节管理 ====================

  async deleteChapter(novelId, chapterId) {
    const response = await authFetch(`${BASE}/novels/${novelId}/chapters/${chapterId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '删除章节失败')
    return data
  },

  // ==================== 小说深度分析（SSE流式） ====================

  async analyzeNovelDeeply(novelId, aiConfig, onData) {
    const response = await authFetch(`${BASE}/novels/${novelId}/deep-analysis`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ aiConfig })
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
          // ignore parse errors for partial chunks
        }
      }
    }
  }
}