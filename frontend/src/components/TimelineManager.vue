<template>
  <el-dialog
    v-model="visible"
    title="📅 故事时间线管理"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="timeline-container">
      <!-- 时间线工具栏 -->
      <div class="timeline-toolbar">
        <el-button type="primary" size="small" @click="showAddEvent = true">
          <el-icon><Plus /></el-icon> 添加事件
        </el-button>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="timeline">时间轴</el-radio-button>
          <el-radio-button label="calendar">日历</el-radio-button>
          <el-radio-button label="list">列表</el-radio-button>
        </el-radio-group>
        <el-select v-model="filterType" placeholder="筛选类型" size="small" clearable>
          <el-option label="全部" value="" />
          <el-option label="章节" value="chapter" />
          <el-option label="角色" value="character" />
          <el-option label="事件" value="event" />
          <el-option label="战斗" value="battle" />
        </el-select>
      </div>

      <!-- 时间轴视图 -->
      <div v-if="viewMode === 'timeline'" class="timeline-view">
        <el-timeline>
          <el-timeline-item
            v-for="event in filteredEvents"
            :key="event.id"
            :type="getEventType(event.type)"
            :color="getEventColor(event.type)"
            :timestamp="formatDate(event.date)"
            :icon="getEventIcon(event.type)"
          >
            <div class="timeline-event-card">
              <div class="event-header">
                <h4 class="event-title">{{ event.title }}</h4>
                <el-tag size="small" :type="getEventType(event.type)">
                  {{ getEventTypeLabel(event.type) }}
                </el-tag>
              </div>
              <p class="event-description">{{ event.description }}</p>
              <div v-if="event.relatedCharacters?.length" class="event-characters">
                <el-tag
                  v-for="char in event.relatedCharacters"
                  :key="char"
                  size="small"
                  class="character-tag"
                >
                  {{ char }}
                </el-tag>
              </div>
              <div class="event-actions">
                <el-button text size="small" @click="editEvent(event)">
                  <el-icon><Edit /></el-icon> 编辑
                </el-button>
                <el-button text type="danger" size="small" @click="deleteEvent(event.id)">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 日历视图 -->
      <div v-else-if="viewMode === 'calendar'" class="calendar-view">
        <el-calendar v-model="selectedDate">
          <template #date-cell="{ data }">
            <div :class="['calendar-cell', { 'has-event': getEventsForDate(data.day).length }]">
              <span>{{ data.day.split('-').pop() }}</span>
              <div v-if="getEventsForDate(data.day).length" class="event-dots">
                <span
                  v-for="event in getEventsForDate(data.day).slice(0, 3)"
                  :key="event.id"
                  class="event-dot"
                  :style="{ background: getEventColor(event.type) }"
                ></span>
              </div>
            </div>
          </template>
        </el-calendar>
        <div v-if="selectedDateEvents.length" class="selected-date-events">
          <h4>{{ formatDate(selectedDate) }} 的事件</h4>
          <el-timeline>
            <el-timeline-item
              v-for="event in selectedDateEvents"
              :key="event.id"
              :type="getEventType(event.type)"
              :color="getEventColor(event.type)"
            >
              <div class="event-mini-card">
                <strong>{{ event.title }}</strong>
                <p>{{ event.description }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table :data="filteredEvents" stripe>
          <el-table-column prop="date" label="日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          <el-table-column prop="title" label="事件" width="200" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getEventType(row.type)">
                {{ getEventTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" @click="editEvent(row)">编辑</el-button>
              <el-button text type="danger" size="small" @click="deleteEvent(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 添加/编辑事件对话框 -->
    <el-dialog
      v-model="showAddEvent"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="500px"
      append-to-body
    >
      <el-form :model="eventForm" label-width="80px">
        <el-form-item label="事件标题">
          <el-input v-model="eventForm.title" placeholder="输入事件标题" />
        </el-form-item>
        <el-form-item label="发生时间">
          <el-date-picker
            v-model="eventForm.date"
            type="datetime"
            placeholder="选择时间"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select v-model="eventForm.type" placeholder="选择类型">
            <el-option label="章节" value="chapter" />
            <el-option label="角色出场" value="character" />
            <el-option label="重要事件" value="event" />
            <el-option label="战斗" value="battle" />
            <el-option label="转折点" value="turning" />
            <el-option label="日常" value="daily" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件描述">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="描述事件详情"
          />
        </el-form-item>
        <el-form-item label="重要程度">
          <el-rate v-model="eventForm.importance" :max="5" />
        </el-form-item>
        <el-form-item label="关联角色">
          <el-select
            v-model="eventForm.relatedCharacters"
            multiple
            placeholder="选择关联角色"
          >
            <el-option
              v-for="char in availableCharacters"
              :key="char.id"
              :label="char.name"
              :value="char.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddEvent = false">取消</el-button>
        <el-button type="primary" @click="saveEvent">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Calendar, User, Bell, Star } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  contents: {
    type: Array,
    default: () => []
  },
  characters: {
    type: Array,
    default: () => []
  },
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const viewMode = ref('timeline')
const filterType = ref('')
const selectedDate = ref(new Date())
const showAddEvent = ref(false)
const editingEvent = ref(null)

const eventForm = ref({
  title: '',
  date: new Date(),
  type: 'event',
  description: '',
  importance: 3,
  relatedCharacters: []
})

// 从章节和角色自动生成事件
const generatedEvents = computed(() => {
  const events = [...props.events]
  
  // 添加章节事件
  props.contents.forEach((content, index) => {
    events.push({
      id: `chapter-${content.id}`,
      title: content.chapter_title || `第${content.chapter_number || index + 1}章`,
      date: content.created_at,
      type: 'chapter',
      description: content.chapter_outline || `章节内容：${content.content?.substring(0, 50)}...`,
      importance: 3,
      relatedCharacters: []
    })
  })
  
  // 添加角色登场事件
  props.characters.forEach(char => {
    if (char.first_appearance) {
      events.push({
        id: `char-${char.id}`,
        title: `${char.name} 登场`,
        date: char.first_appearance,
        type: 'character',
        description: char.description || `角色：${char.name}`,
        importance: 4,
        relatedCharacters: [char.name]
      })
    }
  })
  
  // 去重并排序
  const uniqueEvents = events.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id)
  )
  
  return uniqueEvents.sort((a, b) => new Date(a.date) - new Date(b.date))
})

const filteredEvents = computed(() => {
  if (!filterType.value) return generatedEvents.value
  return generatedEvents.value.filter(e => e.type === filterType.value)
})

const selectedDateEvents = computed(() => {
  const dateStr = selectedDate.value.toLocaleDateString('zh-CN')
  return generatedEvents.value.filter(e => 
    new Date(e.date).toLocaleDateString('zh-CN') === dateStr
  )
})

const availableCharacters = computed(() => props.characters)

const getEventsForDate = (dateStr) => {
  return generatedEvents.value.filter(e => {
    const eventDate = new Date(e.date).toLocaleDateString('zh-CN')
    const checkDate = new Date(dateStr).toLocaleDateString('zh-CN')
    return eventDate === checkDate
  })
}

const getEventType = (type) => {
  const typeMap = {
    chapter: 'primary',
    character: 'success',
    event: 'warning',
    battle: 'danger',
    turning: 'danger',
    daily: 'info'
  }
  return typeMap[type] || 'info'
}

const getEventColor = (type) => {
  const colorMap = {
    chapter: '#409eff',
    character: '#67c23a',
    event: '#e6a23c',
    battle: '#f56c6c',
    turning: '#f56c6c',
    daily: '#909399'
  }
  return colorMap[type] || '#909399'
}

const getEventTypeLabel = (type) => {
  const labelMap = {
    chapter: '章节',
    character: '角色',
    event: '事件',
    battle: '战斗',
    turning: '转折',
    daily: '日常'
  }
  return labelMap[type] || type
}

const getEventIcon = (type) => {
  const iconMap = {
    chapter: 'Document',
    character: 'User',
    event: 'Bell',
    battle: 'Star',
    turning: 'Star',
    daily: 'Calendar'
  }
  return iconMap[type] || 'Calendar'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const editEvent = (event) => {
  editingEvent.value = event
  eventForm.value = {
    title: event.title,
    date: new Date(event.date),
    type: event.type,
    description: event.description,
    importance: event.importance || 3,
    relatedCharacters: event.relatedCharacters || []
  }
  showAddEvent.value = true
}

const deleteEvent = async (eventId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个事件吗？', '确认删除', {
      type: 'warning'
    })
    emit('delete', eventId)
    ElMessage.success('事件已删除')
  } catch {
    // 用户取消
  }
}

const saveEvent = () => {
  if (!eventForm.value.title || !eventForm.value.date) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  const eventData = {
    ...eventForm.value,
    id: editingEvent.value?.id || `event-${Date.now()}`,
    date: eventForm.value.date.toISOString()
  }
  
  emit('save', eventData)
  showAddEvent.value = false
  editingEvent.value = null
  resetForm()
  ElMessage.success('事件已保存')
}

const resetForm = () => {
  eventForm.value = {
    title: '',
    date: new Date(),
    type: 'event',
    description: '',
    importance: 3,
    relatedCharacters: []
  }
}

watch(showAddEvent, (val) => {
  if (!val) {
    editingEvent.value = null
    resetForm()
  }
})
</script>

<style scoped>
.timeline-container {
  padding: 20px;
}

.timeline-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.timeline-view {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 10px;
}

.timeline-event-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-title {
  margin: 0;
  font-size: 16px;
  color: #1f2937;
}

.event-description {
  color: #6b7280;
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
}

.event-characters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 8px 0;
}

.character-tag {
  margin-right: 4px;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.calendar-view {
  display: flex;
  gap: 20px;
}

.calendar-view :deep(.el-calendar) {
  flex: 1;
}

.calendar-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.calendar-cell.has-event {
  background: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.event-dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.selected-date-events {
  width: 300px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.selected-date-events h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
}

.event-mini-card {
  background: white;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}

.event-mini-card strong {
  display: block;
  margin-bottom: 4px;
  color: #374151;
}

.event-mini-card p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.list-view {
  max-height: 600px;
  overflow-y: auto;
}
</style>
