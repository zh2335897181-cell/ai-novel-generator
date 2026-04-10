/**
 * 本地数据库封装 - 基于 localStorage
 * 替代原有的 MySQL 数据存储
 */

const DB_PREFIX = 'ai_novel_'

// 通用的存储操作
function getTable(tableName) {
  try {
    const data = localStorage.getItem(DB_PREFIX + tableName)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setTable(tableName, data) {
  localStorage.setItem(DB_PREFIX + tableName, JSON.stringify(data))
}

function getNextId(tableName) {
  const key = DB_PREFIX + tableName + '_seq'
  const current = parseInt(localStorage.getItem(key) || '0')
  const next = current + 1
  localStorage.setItem(key, String(next))
  return next
}

// ==================== 小说表 ====================
export const novelDB = {
  create(title) {
    const novels = getTable('novels')
    const id = getNextId('novels')
    const novel = {
      id,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    novels.push(novel)
    setTable('novels', novels)
    return id
  },

  list() {
    return getTable('novels').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  },

  get(id) {
    return getTable('novels').find(n => n.id === Number(id))
  },

  delete(id) {
    const novels = getTable('novels').filter(n => n.id !== Number(id))
    setTable('novels', novels)
    // 级联删除关联数据
    worldDB.deleteByNovel(id)
    characterDB.deleteByNovel(id)
    minorCharacterDB.deleteByNovel(id)
    itemDB.deleteByNovel(id)
    locationDB.deleteByNovel(id)
    summaryDB.deleteByNovel(id)
    contentDB.deleteByNovel(id)
    chapterOutlineDB.deleteByNovel(id)
  },

  update(id, updates) {
    const novels = getTable('novels')
    const idx = novels.findIndex(n => n.id === Number(id))
    if (idx >= 0) {
      novels[idx] = { ...novels[idx], ...updates, updated_at: new Date().toISOString() }
      setTable('novels', novels)
    }
  }
}

// ==================== 世界设定表 ====================
export const worldDB = {
  get(novelId) {
    return getTable('worlds').find(w => w.novel_id === Number(novelId)) || null
  },

  create(novelId) {
    const worlds = getTable('worlds')
    const existing = worlds.find(w => w.novel_id === Number(novelId))
    if (existing) return existing.id
    const id = getNextId('worlds')
    const world = {
      id,
      novel_id: Number(novelId),
      genre: '',
      style: '',
      rules: '待设定',
      background: '待设定',
      extra: '{}',
      realm_system: '{}',
      updated_at: new Date().toISOString()
    }
    worlds.push(world)
    setTable('worlds', worlds)
    return id
  },

  update(novelId, updates) {
    const worlds = getTable('worlds')
    const idx = worlds.findIndex(w => w.novel_id === Number(novelId))
    if (idx >= 0) {
      worlds[idx] = { ...worlds[idx], ...updates, updated_at: new Date().toISOString() }
      setTable('worlds', worlds)
    }
  },

  deleteByNovel(novelId) {
    const worlds = getTable('worlds').filter(w => w.novel_id !== Number(novelId))
    setTable('worlds', worlds)
  }
}

// ==================== 角色状态表 ====================
export const characterDB = {
  list(novelId) {
    return getTable('characters').filter(c => c.novel_id === Number(novelId)).sort((a, b) => a.id - b.id)
  },

  add(novelId, name, level = 1, realm = null, attributes = {}) {
    const characters = getTable('characters')
    const id = getNextId('characters')
    const char = {
      id,
      novel_id: Number(novelId),
      name,
      level,
      realm,
      status: '正常',
      attributes: typeof attributes === 'string' ? attributes : JSON.stringify(attributes),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    characters.push(char)
    setTable('characters', characters)
    return id
  },

  update(novelId, name, updates) {
    const characters = getTable('characters')
    const idx = characters.findIndex(c => c.novel_id === Number(novelId) && c.name === name)
    if (idx >= 0) {
      characters[idx] = { ...characters[idx], ...updates, updated_at: new Date().toISOString() }
      setTable('characters', characters)
    }
  },

  deleteByNovel(novelId) {
    const chars = getTable('characters').filter(c => c.novel_id !== Number(novelId))
    setTable('characters', chars)
  }
}

// ==================== 配角状态表 ====================
export const minorCharacterDB = {
  list(novelId) {
    return getTable('minor_characters').filter(m => m.novel_id === Number(novelId)).sort((a, b) => a.id - b.id)
  },

  add(novelId, data) {
    const minors = getTable('minor_characters')
    const id = getNextId('minor_characters')
    const minor = {
      id,
      novel_id: Number(novelId),
      name: data.name,
      role: data.role || '路人',
      status: data.status || '正常',
      description: data.description || '',
      items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []),
      first_appearance: data.first_appearance || 1,
      last_appearance: data.last_appearance || 1,
      created_at: new Date().toISOString()
    }
    minors.push(minor)
    setTable('minor_characters', minors)
    return id
  },

  update(novelId, name, updates) {
    const minors = getTable('minor_characters')
    const idx = minors.findIndex(m => m.novel_id === Number(novelId) && m.name === name)
    if (idx >= 0) {
      minors[idx] = { ...minors[idx], ...updates }
      setTable('minor_characters', minors)
    }
  },

  deleteByNovel(novelId) {
    const minors = getTable('minor_characters').filter(m => m.novel_id !== Number(novelId))
    setTable('minor_characters', minors)
  }
}

// ==================== 物品状态表 ====================
export const itemDB = {
  list(novelId) {
    return getTable('items').filter(i => i.novel_id === Number(novelId)).sort((a, b) => a.id - b.id)
  },

  add(novelId, data) {
    const items = getTable('items')
    const id = getNextId('items')
    const item = {
      id,
      novel_id: Number(novelId),
      name: data.name,
      type: data.type || '未知',
      owner: data.owner || null,
      status: data.status || '存在',
      attributes: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    items.push(item)
    setTable('items', items)
    return id
  },

  update(novelId, name, updates) {
    const items = getTable('items')
    const idx = items.findIndex(i => i.novel_id === Number(novelId) && i.name === name)
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() }
      setTable('items', items)
    }
  },

  deleteByNovel(novelId) {
    const items = getTable('items').filter(i => i.novel_id !== Number(novelId))
    setTable('items', items)
  }
}

// ==================== 地点状态表 ====================
export const locationDB = {
  list(novelId) {
    return getTable('locations').filter(l => l.novel_id === Number(novelId)).sort((a, b) => a.id - b.id)
  },

  add(novelId, data) {
    const locations = getTable('locations')
    const id = getNextId('locations')
    const location = {
      id,
      novel_id: Number(novelId),
      name: data.name,
      type: data.type || '未知',
      status: data.status || '正常',
      description: data.description || '',
      attributes: '{}',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    locations.push(location)
    setTable('locations', locations)
    return id
  },

  update(novelId, name, updates) {
    const locations = getTable('locations')
    const idx = locations.findIndex(l => l.novel_id === Number(novelId) && l.name === name)
    if (idx >= 0) {
      locations[idx] = { ...locations[idx], ...updates, updated_at: new Date().toISOString() }
      setTable('locations', locations)
    }
  },

  deleteByNovel(novelId) {
    const locations = getTable('locations').filter(l => l.novel_id !== Number(novelId))
    setTable('locations', locations)
  }
}

// ==================== 故事摘要表 ====================
export const summaryDB = {
  get(novelId) {
    const summaries = getTable('summaries')
    return summaries.find(s => s.novel_id === Number(novelId))?.summary || ''
  },

  set(novelId, summary) {
    const summaries = getTable('summaries')
    const idx = summaries.findIndex(s => s.novel_id === Number(novelId))
    if (idx >= 0) {
      summaries[idx].summary = summary
      summaries[idx].updated_at = new Date().toISOString()
    } else {
      summaries.push({
        id: getNextId('summaries'),
        novel_id: Number(novelId),
        summary,
        updated_at: new Date().toISOString()
      })
    }
    setTable('summaries', summaries)
  },

  deleteByNovel(novelId) {
    const summaries = getTable('summaries').filter(s => s.novel_id !== Number(novelId))
    setTable('summaries', summaries)
  }
}

// ==================== 故事内容表 ====================
export const contentDB = {
  list(novelId, limit = 50) {
    return getTable('contents')
      .filter(c => c.novel_id === Number(novelId))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  },

  add(novelId, data) {
    const contents = getTable('contents')
    const id = getNextId('contents')
    const content = {
      id,
      novel_id: Number(novelId),
      chapter_number: data.chapter_number || 1,
      chapter_title: data.chapter_title || '',
      chapter_outline: data.chapter_outline || '',
      content: data.content,
      word_count: data.word_count || data.content.length,
      created_at: new Date().toISOString()
    }
    contents.push(content)
    setTable('contents', contents)
    return id
  },

  getMaxChapterNumber(novelId) {
    const contents = getTable('contents').filter(c => c.novel_id === Number(novelId))
    if (contents.length === 0) return 0
    return Math.max(...contents.map(c => c.chapter_number || 0))
  },

  deleteByNovel(novelId) {
    const contents = getTable('contents').filter(c => c.novel_id !== Number(novelId))
    setTable('contents', contents)
  }
}

// ==================== 章节大纲表 ====================
export const chapterOutlineDB = {
  list(novelId) {
    return getTable('chapter_outlines')
      .filter(c => c.novel_id === Number(novelId))
      .sort((a, b) => a.chapter_number - b.chapter_number)
  },

  add(novelId, data) {
    const outlines = getTable('chapter_outlines')
    const id = getNextId('chapter_outlines')
    const outline = {
      id,
      novel_id: Number(novelId),
      chapter_number: data.chapter_number,
      title: data.title,
      outline: data.outline,
      status: data.status || '未开始',
      created_at: new Date().toISOString()
    }
    outlines.push(outline)
    setTable('chapter_outlines', outlines)
    return id
  },

  getMaxChapterNumber(novelId) {
    const outlines = getTable('chapter_outlines').filter(c => c.novel_id === Number(novelId))
    if (outlines.length === 0) return 0
    return Math.max(...outlines.map(c => c.chapter_number || 0))
  },

  deleteByNovel(novelId) {
    const outlines = getTable('chapter_outlines').filter(c => c.novel_id !== Number(novelId))
    setTable('chapter_outlines', outlines)
  }
}

// ==================== 数据导入/导出 ====================
export const dataManager = {
  exportAll() {
    const data = {}
    const tables = ['novels', 'worlds', 'characters', 'minor_characters', 'items', 'locations', 'summaries', 'contents', 'chapter_outlines']
    tables.forEach(t => {
      data[t] = getTable(t)
    })
    // 保存序列号
    tables.forEach(t => {
      const seq = localStorage.getItem(DB_PREFIX + t + '_seq')
      if (seq) data[t + '_seq'] = parseInt(seq)
    })
    return data
  },

  importAll(data) {
    const tables = ['novels', 'worlds', 'characters', 'minor_characters', 'items', 'locations', 'summaries', 'contents', 'chapter_outlines']
    tables.forEach(t => {
      if (data[t]) setTable(t, data[t])
      if (data[t + '_seq']) localStorage.setItem(DB_PREFIX + t + '_seq', String(data[t + '_seq']))
    })
  },

  clearAll() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith(DB_PREFIX)) {
        keys.push(key)
      }
    }
    keys.forEach(k => localStorage.removeItem(k))
  },

  getStorageSize() {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith(DB_PREFIX)) {
        total += localStorage.getItem(key).length * 2 // UTF-16
      }
    }
    return total
  }
}

