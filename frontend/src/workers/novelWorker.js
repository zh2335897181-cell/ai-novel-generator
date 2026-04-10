// 小说数据处理 Web Worker
// 用于处理大量数据的计算，避免阻塞主线程

self.onmessage = function(e) {
  const { type, data } = e.data
  
  switch (type) {
    case 'analyzeText':
      const analysis = analyzeText(data.text)
      self.postMessage({ type: 'analysisComplete', result: analysis })
      break
    case 'calculateStats':
      const stats = calculateStats(data.contents)
      self.postMessage({ type: 'statsComplete', result: stats })
      break
    case 'processBatch':
      const processed = processBatch(data.items, data.operation)
      self.postMessage({ type: 'batchComplete', result: processed })
      break
    case 'generateTimeline':
      const timeline = generateTimelineData(data.contents, data.characters)
      self.postMessage({ type: 'timelineComplete', result: timeline })
      break
    default:
      self.postMessage({ type: 'error', message: 'Unknown operation type' })
  }
}

// 文本分析函数
function analyzeText(text) {
  const startTime = performance.now()
  
  // 字数统计
  const charCount = text.length
  const wordCount = text.trim().split(/\s+/).length
  
  // 段落统计
  const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0)
  const paragraphCount = paragraphs.length
  
  // 句子统计
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length
  
  // 平均句长
  const avgSentenceLength = sentenceCount > 0 ? Math.round(charCount / sentenceCount) : 0
  
  // 对话统计（引号内内容）
  const dialogueMatches = text.match(/[""""]([^""""]+)[""""]/g) || []
  const dialogueCount = dialogueMatches.length
  
  // 标点符号统计
  const punctuationCount = (text.match(/[，。！？；：""""'''''']/g) || []).length
  
  // 高频词统计（简单实现）
  const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []
  const wordFreq = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
  
  const endTime = performance.now()
  
  return {
    charCount,
    wordCount,
    paragraphCount,
    sentenceCount,
    avgSentenceLength,
    dialogueCount,
    punctuationCount,
    topWords,
    processingTime: Math.round(endTime - startTime)
  }
}

// 统计数据计算
function calculateStats(contents) {
  const startTime = performance.now()
  
  // 总字数
  const totalWordCount = contents.reduce((sum, c) => sum + (c.word_count || 0), 0)
  
  // 章节统计
  const chapterCount = contents.length
  
  // 平均章节字数
  const avgWordCount = chapterCount > 0 ? Math.round(totalWordCount / chapterCount) : 0
  
  // 字数分布
  const wordDistribution = {
    short: contents.filter(c => (c.word_count || 0) < 500).length,
    medium: contents.filter(c => (c.word_count || 0) >= 500 && (c.word_count || 0) < 1500).length,
    long: contents.filter(c => (c.word_count || 0) >= 1500).length
  }
  
  // 时间分布（按天分组）
  const timeDistribution = {}
  contents.forEach(c => {
    const date = new Date(c.created_at).toLocaleDateString('zh-CN')
    timeDistribution[date] = (timeDistribution[date] || 0) + 1
  })
  
  // 写作频率分析
  const sortedDates = Object.keys(timeDistribution).sort()
  const writingStreak = calculateWritingStreak(sortedDates)
  
  const endTime = performance.now()
  
  return {
    totalWordCount,
    chapterCount,
    avgWordCount,
    wordDistribution,
    timeDistribution,
    writingStreak,
    processingTime: Math.round(endTime - startTime)
  }
}

// 计算连续写作天数
function calculateWritingStreak(dates) {
  if (dates.length === 0) return { maxStreak: 0, currentStreak: 0 }
  
  let maxStreak = 1
  let currentStreak = 1
  
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currDate = new Date(dates[i])
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24)
    
    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }
  
  // 计算当前连续天数
  const today = new Date().toLocaleDateString('zh-CN')
  const lastDate = dates[dates.length - 1]
  const lastDateObj = new Date(lastDate)
  const todayObj = new Date(today)
  const daysSinceLastWrite = (todayObj - lastDateObj) / (1000 * 60 * 60 * 24)
  
  return {
    maxStreak,
    currentStreak: daysSinceLastWrite <= 1 ? currentStreak : 0,
    daysSinceLastWrite: Math.round(daysSinceLastWrite)
  }
}

// 批量数据处理
function processBatch(items, operation) {
  const startTime = performance.now()
  const results = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let result
    
    switch (operation) {
      case 'format':
        result = formatContent(item)
        break
      case 'validate':
        result = validateContent(item)
        break
      case 'extractKeywords':
        result = extractKeywords(item)
        break
      default:
        result = item
    }
    
    results.push(result)
    
    // 每处理100项报告一次进度
    if ((i + 1) % 100 === 0) {
      self.postMessage({ 
        type: 'progress', 
        progress: Math.round(((i + 1) / items.length) * 100),
        processed: i + 1,
        total: items.length
      })
    }
  }
  
  const endTime = performance.now()
  
  return {
    results,
    processed: items.length,
    processingTime: Math.round(endTime - startTime)
  }
}

// 格式化内容
function formatContent(content) {
  return {
    ...content,
    formattedContent: content.content
      ?.replace(/\n{3,}/g, '\n\n')
      ?.trim() || ''
  }
}

// 验证内容
function validateContent(content) {
  const errors = []
  
  if (!content.content || content.content.trim().length === 0) {
    errors.push('内容为空')
  }
  
  if ((content.word_count || 0) < 100) {
    errors.push('字数过少')
  }
  
  // 检查重复内容
  if (content.content) {
    const sentences = content.content.split(/[。！？.!?]+/)
    const duplicates = sentences.filter((item, index) => sentences.indexOf(item) !== index)
    if (duplicates.length > 0) {
      errors.push('存在重复句子')
    }
  }
  
  return {
    ...content,
    isValid: errors.length === 0,
    errors
  }
}

// 提取关键词
function extractKeywords(content) {
  const text = content.content || ''
  const words = text.match(/[\u4e00-\u9fa5]{2,4}/g) || []
  const freq = {}
  
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1
  })
  
  return {
    ...content,
    keywords: Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  }
}

// 生成时间线数据
function generateTimelineData(contents, characters) {
  const events = []
  
  // 章节事件
  contents.forEach((content, index) => {
    events.push({
      id: `chapter-${content.id}`,
      type: 'chapter',
      title: content.chapter_title || `第${content.chapter_number}章`,
      date: content.created_at,
      description: content.chapter_outline || '',
      importance: 'normal',
      relatedCharacters: []
    })
  })
  
  // 角色出场事件
  characters.forEach(char => {
    if (char.first_appearance) {
      events.push({
        id: `char-${char.id}`,
        type: 'character',
        title: `${char.name} 登场`,
        date: char.first_appearance,
        description: char.description || '',
        importance: 'high',
        character: char.name
      })
    }
  })
  
  // 按时间排序
  events.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  return {
    events,
    totalEvents: events.length,
    chapters: contents.length,
    characterEvents: characters.length
  }
}

