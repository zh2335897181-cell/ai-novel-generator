const db = require('../config/database')

/**
 * 获取小说的时间线事件列表
 */
async function getTimelineEvents(req, res) {
  try {
    const { novelId } = req.params
    
    const [events] = await db.query(
      `SELECT * FROM timeline_events 
       WHERE novel_id = ? 
       ORDER BY event_date ASC, created_at ASC`,
      [novelId]
    )
    
    // 解析JSON字段
    const parsedEvents = events.map(event => ({
      ...event,
      related_characters: event.related_characters ? JSON.parse(event.related_characters) : []
    }))
    
    res.json({
      success: true,
      data: parsedEvents
    })
  } catch (error) {
    console.error('获取时间线事件失败:', error)
    res.status(500).json({
      success: false,
      error: '获取时间线事件失败'
    })
  }
}

/**
 * 创建时间线事件
 */
async function createTimelineEvent(req, res) {
  try {
    const { novelId } = req.params
    const {
      title,
      event_date,
      type = 'event',
      description,
      importance = 3,
      related_characters = [],
      related_chapter
    } = req.body
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: '事件标题不能为空'
      })
    }
    
    const [result] = await db.query(
      `INSERT INTO timeline_events 
       (novel_id, title, event_date, type, description, importance, related_characters, related_chapter) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        novelId,
        title,
        event_date || null,
        type,
        description || null,
        importance,
        JSON.stringify(related_characters),
        related_chapter || null
      ]
    )
    
    // 获取刚创建的事件
    const [newEvent] = await db.query(
      'SELECT * FROM timeline_events WHERE id = ?',
      [result.insertId]
    )
    
    res.json({
      success: true,
      data: {
        ...newEvent[0],
        related_characters: related_characters
      }
    })
  } catch (error) {
    console.error('创建时间线事件失败:', error)
    res.status(500).json({
      success: false,
      error: '创建时间线事件失败'
    })
  }
}

/**
 * 更新时间线事件
 */
async function updateTimelineEvent(req, res) {
  try {
    const { eventId } = req.params
    const {
      title,
      event_date,
      type,
      description,
      importance,
      related_characters,
      related_chapter
    } = req.body
    
    // 构建动态更新字段
    const updates = []
    const values = []
    
    if (title !== undefined) {
      updates.push('title = ?')
      values.push(title)
    }
    if (event_date !== undefined) {
      updates.push('event_date = ?')
      values.push(event_date)
    }
    if (type !== undefined) {
      updates.push('type = ?')
      values.push(type)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (importance !== undefined) {
      updates.push('importance = ?')
      values.push(importance)
    }
    if (related_characters !== undefined) {
      updates.push('related_characters = ?')
      values.push(JSON.stringify(related_characters))
    }
    if (related_chapter !== undefined) {
      updates.push('related_chapter = ?')
      values.push(related_chapter)
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有要更新的字段'
      })
    }
    
    values.push(eventId)
    
    await db.query(
      `UPDATE timeline_events SET ${updates.join(', ')} WHERE id = ?`,
      values
    )
    
    // 获取更新后的事件
    const [updatedEvent] = await db.query(
      'SELECT * FROM timeline_events WHERE id = ?',
      [eventId]
    )
    
    if (updatedEvent.length === 0) {
      return res.status(404).json({
        success: false,
        error: '事件不存在'
      })
    }
    
    res.json({
      success: true,
      data: {
        ...updatedEvent[0],
        related_characters: updatedEvent[0].related_characters ? 
          JSON.parse(updatedEvent[0].related_characters) : []
      }
    })
  } catch (error) {
    console.error('更新时间线事件失败:', error)
    res.status(500).json({
      success: false,
      error: '更新时间线事件失败'
    })
  }
}

/**
 * 删除时间线事件
 */
async function deleteTimelineEvent(req, res) {
  try {
    const { eventId } = req.params
    
    const [result] = await db.query(
      'DELETE FROM timeline_events WHERE id = ?',
      [eventId]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: '事件不存在'
      })
    }
    
    res.json({
      success: true,
      message: '事件已删除'
    })
  } catch (error) {
    console.error('删除时间线事件失败:', error)
    res.status(500).json({
      success: false,
      error: '删除时间线事件失败'
    })
  }
}

module.exports = {
  getTimelineEvents,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent
}
