<template>
  <el-dialog
    v-model="visible"
    title="📈 主角成长曲线"
    width="900px"
    class="growth-chart-dialog"
  >
    <div class="growth-chart-content">
      <!-- 角色选择器 -->
      <div class="character-selector">
        <span class="selector-label">选择角色：</span>
        <el-select v-model="selectedCharacter" placeholder="请选择角色" style="width: 200px;">
          <el-option
            v-for="char in mainCharacters"
            :key="char.id"
            :label="char.name + (char.realm ? ` (${char.realm})` : ` (Lv.${char.level})`)"
            :value="char.name"
          />
        </el-select>
      </div>

      <!-- 成长曲线图表 -->
      <div v-if="growthData.length > 0" class="chart-container">
        <div class="chart-header">
          <h3>{{ selectedCharacter }} 的成长轨迹</h3>
          <div class="growth-stats">
            <el-tag type="success">当前：{{ currentLevel }}</el-tag>
            <el-tag type="info">总章节：{{ growthData.length }}章</el-tag>
            <el-tag type="warning">成长幅度：{{ growthRange }}</el-tag>
          </div>
        </div>

        <!-- SVG 成长曲线 -->
        <div class="svg-chart-wrapper">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="growth-svg">
            <!-- 背景网格 -->
            <g class="grid">
              <line
                v-for="i in 5"
                :key="`h-${i}`"
                :x1="padding"
                :y1="padding + (chartHeight - 2 * padding) * (i - 1) / 4"
                :x2="chartWidth - padding"
                :y2="padding + (chartHeight - 2 * padding) * (i - 1) / 4"
                stroke="#e5e7eb"
                stroke-width="1"
              />
              <line
                v-for="i in chapterTicks"
                :key="`v-${i}`"
                :x1="padding + (chartWidth - 2 * padding) * (i - 1) / (chapterTicks - 1)"
                :y1="padding"
                :x2="padding + (chartWidth - 2 * padding) * (i - 1) / (chapterTicks - 1)"
                :y2="chartHeight - padding"
                stroke="#e5e7eb"
                stroke-width="1"
                stroke-dasharray="4,4"
              />
            </g>

            <!-- 坐标轴 -->
            <g class="axis">
              <!-- X轴 -->
              <line
                :x1="padding"
                :y1="chartHeight - padding"
                :x2="chartWidth - padding"
                :y2="chartHeight - padding"
                stroke="#6b7280"
                stroke-width="2"
              />
              <!-- Y轴 -->
              <line
                :x1="padding"
                :y1="padding"
                :x2="padding"
                :y2="chartHeight - padding"
                stroke="#6b7280"
                stroke-width="2"
              />
            </g>

            <!-- 坐标轴标签 -->
            <g class="labels">
              <!-- X轴标签 -->
              <text
                v-for="(point, index) in growthData"
                :key="`x-label-${index}`"
                :x="getX(index)"
                :y="chartHeight - padding + 20"
                text-anchor="middle"
                font-size="12"
                fill="#6b7280"
              >
                {{ point.chapter }}
              </text>
              <text
                :x="chartWidth / 2"
                :y="chartHeight - 10"
                text-anchor="middle"
                font-size="14"
                fill="#374151"
                font-weight="600"
              >
                章节
              </text>

              <!-- Y轴标签 -->
              <text
                v-for="i in 5"
                :key="`y-label-${i}`"
                :x="padding - 10"
                :y="padding + (chartHeight - 2 * padding) * (i - 1) / 4 + 4"
                text-anchor="end"
                font-size="12"
                fill="#6b7280"
              >
                {{ Math.round(maxValue - (maxValue - minValue) * (i - 1) / 4) }}
              </text>
              <text
                :x="20"
                :y="chartHeight / 2"
                text-anchor="middle"
                font-size="14"
                fill="#374151"
                font-weight="600"
                transform="rotate(-90, 20, ${chartHeight / 2})"
              >
                {{ hasRealmSystem ? '境界层级' : '等级' }}
              </text>
            </g>

            <!-- 成长曲线 -->
            <path
              :d="growthPath"
              fill="none"
              stroke="url(#gradient)"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#fb7185" />
                <stop offset="50%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#a855f7" />
              </linearGradient>
            </defs>

            <!-- 数据点 -->
            <g class="data-points">
              <circle
                v-for="(point, index) in growthData"
                :key="`point-${index}`"
                :cx="getX(index)"
                :cy="getY(point.value)"
                r="6"
                fill="white"
                :stroke="getPointColor(index)"
                stroke-width="3"
                class="data-point"
              />
            </g>

            <!-- 境界标签（如果有境界系统） -->
            <g v-if="hasRealmSystem" class="realm-labels">
              <text
                v-for="(point, index) in growthData.filter(p => p.realm)"
                :key="`realm-${index}`"
                :x="getX(growthData.indexOf(point))"
                :y="getY(point.value) - 15"
                text-anchor="middle"
                font-size="11"
                fill="#fb7185"
                font-weight="600"
              >
                {{ point.realm }}
              </text>
            </g>
          </svg>
        </div>

        <!-- 关键事件时间线 -->
        <div class="timeline-section">
          <h4>🎯 关键成长节点</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(point, index) in significantEvents"
              :key="index"
              :type="point.type"
              :timestamp="`第${point.chapter}章`"
            >
              <div class="timeline-content">
                <span class="event-title">{{ point.title }}</span>
                <span class="event-desc">{{ point.description }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂无成长数据，生成更多章节后查看" :image-size="120">
        <template #description>
          <p>暂无成长数据</p>
          <p class="empty-hint">生成更多章节后，系统会自动追踪角色成长</p>
        </template>
      </el-empty>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  novelId: {
    type: [String, Number],
    required: true
  },
  mainCharacters: {
    type: Array,
    default: () => []
  },
  contents: {
    type: Array,
    default: () => []
  },
  worldState: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedCharacter = ref('')

// 图表尺寸
const chartWidth = 800
const chartHeight = 400
const padding = 60

// 是否有境界系统
const hasRealmSystem = computed(() => {
  if (!props.worldState?.realm_system) return false
  try {
    const realmSystem = typeof props.worldState.realm_system === 'string'
      ? JSON.parse(props.worldState.realm_system)
      : props.worldState.realm_system
    return realmSystem?.has_realm === true
  } catch {
    return false
  }
})

// 境界列表
const realmList = computed(() => {
  if (!hasRealmSystem.value) return []
  try {
    const realmSystem = typeof props.worldState.realm_system === 'string'
      ? JSON.parse(props.worldState.realm_system)
      : props.worldState.realm_system
    return realmSystem?.realms || []
  } catch {
    return []
  }
})

// 将境界转换为数值
const realmToValue = (realm) => {
  if (!realm || !hasRealmSystem.value) return 0
  const index = realmList.value.indexOf(realm)
  return index >= 0 ? index + 1 : 0
}

// 计算成长数据
const growthData = computed(() => {
  if (!selectedCharacter.value || props.contents.length === 0) return []

  const data = []
  let currentLevel = 1
  let currentRealm = null

  // 遍历所有章节内容，提取角色成长信息
  props.contents.forEach((content, index) => {
    const chapter = content.chapter_number || props.contents.length - index
    
    // 从角色更新中提取信息
    if (content.character_updates) {
      const update = content.character_updates.find(
        u => u.name === selectedCharacter.value
      )
      if (update) {
        currentLevel = update.level || currentLevel
        currentRealm = update.realm || currentRealm
      }
    }

    // 从内容中解析境界信息（简单匹配）
    if (content.content && hasRealmSystem.value) {
      for (const realm of realmList.value) {
        if (content.content.includes(`${selectedCharacter.value}突破到${realm}`) ||
            content.content.includes(`${selectedCharacter.value}达到${realm}`)) {
          currentRealm = realm
          break
        }
      }
    }

    // 计算数值
    let value = currentLevel
    if (hasRealmSystem.value && currentRealm) {
      value = realmToValue(currentRealm)
    }

    data.push({
      chapter,
      level: currentLevel,
      realm: currentRealm,
      value,
      title: content.chapter_title || `第${chapter}章`,
      outline: content.chapter_outline || ''
    })
  })

  return data.reverse() // 按章节顺序排列
})

// 计算最大值和最小值
const maxValue = computed(() => {
  if (growthData.value.length === 0) return 10
  return Math.max(...growthData.value.map(d => d.value), 10)
})

const minValue = computed(() => {
  if (growthData.value.length === 0) return 0
  return Math.min(...growthData.value.map(d => d.value), 0)
})

// X轴刻度数量
const chapterTicks = computed(() => {
  return Math.min(growthData.value.length, 10)
})

// 获取X坐标
const getX = (index) => {
  if (growthData.value.length <= 1) return padding
  return padding + (chartWidth - 2 * padding) * index / (growthData.value.length - 1)
}

// 获取Y坐标
const getY = (value) => {
  const range = maxValue.value - minValue.value || 1
  const normalizedValue = (value - minValue.value) / range
  return chartHeight - padding - (chartHeight - 2 * padding) * normalizedValue
}

// 生成路径
const growthPath = computed(() => {
  if (growthData.value.length === 0) return ''
  
  return growthData.value.map((point, index) => {
    const x = getX(index)
    const y = getY(point.value)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

// 获取点的颜色
const getPointColor = (index) => {
  const colors = ['#fb7185', '#38bdf8', '#a855f7', '#f59e0b']
  return colors[index % colors.length]
}

// 当前等级显示
const currentLevel = computed(() => {
  if (growthData.value.length === 0) return '-'
  const last = growthData.value[growthData.value.length - 1]
  if (hasRealmSystem.value && last.realm) {
    return last.realm
  }
  return `Lv.${last.level}`
})

// 成长幅度
const growthRange = computed(() => {
  if (growthData.value.length < 2) return '-'
  const first = growthData.value[0].value
  const last = growthData.value[growthData.value.length - 1].value
  const diff = last - first
  if (hasRealmSystem.value) {
    return diff > 0 ? `提升${diff}个境界` : '无变化'
  }
  return diff > 0 ? `+${diff}级` : '无变化'
})

// 重要事件
const significantEvents = computed(() => {
  const events = []
  
  growthData.value.forEach((point, index) => {
    // 境界突破事件
    if (index > 0 && point.realm && point.realm !== growthData.value[index - 1].realm) {
      events.push({
        chapter: point.chapter,
        title: `突破至${point.realm}`,
        description: point.outline.substring(0, 50) + '...',
        type: 'success'
      })
    }
    // 等级大幅提升事件
    if (index > 0 && point.level - growthData.value[index - 1].level >= 3) {
      events.push({
        chapter: point.chapter,
        title: `等级大幅提升至Lv.${point.level}`,
        description: point.outline.substring(0, 50) + '...',
        type: 'warning'
      })
    }
    // 第一章事件
    if (index === 0) {
      events.push({
        chapter: point.chapter,
        title: '故事开始',
        description: `初始状态：${hasRealmSystem.value && point.realm ? point.realm : 'Lv.' + point.level}`,
        type: 'info'
      })
    }
  })

  return events.slice(0, 5) // 最多显示5个关键事件
})

// 默认选中第一个主要角色
watch(() => props.mainCharacters, (chars) => {
  if (chars.length > 0 && !selectedCharacter.value) {
    selectedCharacter.value = chars[0].name
  }
}, { immediate: true })
</script>

<style scoped>
.growth-chart-dialog :deep(.el-dialog) {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.growth-chart-content {
  padding: 20px;
}

.character-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

.selector-label {
  font-weight: 600;
  color: #374151;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  border-radius: 12px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2933;
}

.growth-stats {
  display: flex;
  gap: 8px;
}

.svg-chart-wrapper {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.growth-svg {
  width: 100%;
  height: auto;
  max-height: 400px;
}

.data-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-point:hover {
  r: 8;
  filter: drop-shadow(0 0 8px rgba(251, 113, 133, 0.6));
}

.timeline-section {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 20px;
}

.timeline-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-title {
  font-weight: 600;
  color: #1f2933;
}

.event-desc {
  font-size: 13px;
  color: #6b7280;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 8px;
}

:deep(.el-timeline-item__node) {
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
}

:deep(.el-timeline-item__tail) {
  border-left-color: rgba(251, 113, 133, 0.3);
}
</style>
