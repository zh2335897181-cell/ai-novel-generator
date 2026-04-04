<template>
  <div class="relationship-visualization">
    <div class="relationship-chart">
      <div 
        v-for="char in characters" 
        :key="char.id" 
        class="relationship-node"
        :class="{ 'has-connections': getCharacterRelations(char.id).length > 0 }"
      >
        <div class="node-avatar" :style="{ backgroundColor: getAvatarColor(char.id) }">
          {{ char.name[0] }}
        </div>
        <div class="node-info">
          <div class="node-name">{{ char.name }}</div>
          <div class="node-role" v-if="char.role">{{ char.role }}</div>
        </div>
        <div class="node-connections">
          <div 
            v-for="rel in getCharacterRelations(char.id)" 
            :key="rel.id" 
            class="connection-item"
            :class="`relation-type-${rel.type}`"
          >
            <el-tag size="small" effect="plain">
              {{ rel.targetName }} · {{ rel.type }}
            </el-tag>
          </div>
        </div>
      </div>
      <el-empty 
        v-if="characters.length === 0" 
        description="暂无角色，无法生成关系图" 
        :image-size="80"
      />
    </div>
    
    <div class="relationship-actions">
      <el-button type="primary" @click="$emit('add-relation')" size="default">
        <el-icon><Plus /></el-icon> 添加关系
      </el-button>
      <el-button @click="$emit('show-graph')" size="default">
        <el-icon><MagicStick /></el-icon> AI分析关系
      </el-button>
      <el-button text @click="clearRelations" size="default" v-if="relations.length > 0">
        <el-icon><Delete /></el-icon> 清空
      </el-button>
    </div>
    
    <div class="relationship-stats" v-if="relations.length > 0">
      <el-tag type="info" effect="plain">
        共 {{ characters.length }} 个角色 · {{ relations.length }} 组关系
      </el-tag>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MagicStick, Delete, Loading, Right, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps({
  characters: {
    type: Array,
    default: () => []
  },
  initialRelations: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-relation', 'update:relations', 'show-graph'])

const relations = ref([...props.initialRelations])
const analyzing = ref(false)
const showGraphDialog = ref(false)
const graphChart = ref(null)
let chartInstance = null

// 头像颜色映射
const avatarColors = [
  '#fb7185', '#38bdf8', '#a855f7', '#22c55e', 
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
]

const getAvatarColor = (charId) => {
  const index = charId?.toString().charCodeAt(0) % avatarColors.length
  return avatarColors[index] || avatarColors[0]
}

// 关系类型标签样式
const getRelationTypeTag = (type) => {
  const map = {
    '师徒': 'danger',
    '朋友': 'primary',
    '对手': 'danger',
    '盟友': 'success',
    '亲人': 'warning',
    '同事': 'info',
    '恋人': 'danger'
  }
  return map[type] || 'info'
}

// 获取角色的关系
const getCharacterRelations = (charId) => {
  return relations.value.filter(r => r.sourceId === charId || r.targetId === charId)
    .map(r => {
      const isSource = r.sourceId === charId
      return {
        ...r,
        targetName: isSource ? r.targetName : r.sourceName,
        direction: isSource ? 'out' : 'in'
      }
    })
}

// 初始化图表
const initChart = () => {
  if (!graphChart.value) return
  
  chartInstance = echarts.init(graphChart.value)
  updateChart()
  
  // 响应式
  const resizeHandler = () => chartInstance?.resize()
  window.addEventListener('resize', resizeHandler)
  
  // 点击节点事件
  chartInstance.on('click', (params) => {
    if (params.dataType === 'node') {
      console.log('点击角色:', params.data)
    }
  })
}

// 更新图表数据
const updateChart = () => {
  if (!chartInstance || relations.value.length === 0) return
  
  const nodes = props.characters.map(char => ({
    id: char.id,
    name: char.name,
    value: char.name,
    symbolSize: 60 + (getCharacterRelations(char.id).length * 10),
    itemStyle: {
      color: getAvatarColor(char.id)
    },
    label: {
      show: true,
      fontSize: 14,
      fontWeight: 'bold'
    }
  }))
  
  const links = relations.value.map(rel => ({
    source: rel.sourceId,
    target: rel.targetId,
    value: rel.type,
    label: {
      show: true,
      formatter: rel.type,
      fontSize: 12
    },
    lineStyle: {
      width: (rel.strength || 3) / 2,
      curveness: 0.2
    }
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          const relCount = getCharacterRelations(params.data.id).length
          return `${params.name}<br/>关联角色: ${relCount}个`
        }
        return `${params.data.source} → ${params.data.target}<br/>关系: ${params.data.value}`
      }
    },
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        label: {
          position: 'bottom',
          formatter: '{b}'
        },
        force: {
          repulsion: 300,
          edgeLength: 150,
          gravity: 0.1
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4
          }
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// 高亮关系
const highlightRelation = (rel) => {
  if (!chartInstance) return
  chartInstance.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: props.characters.findIndex(c => c.id === rel.sourceId)
  })
}

// 取消高亮
const unhighlightRelation = () => {
  if (!chartInstance) return
  chartInstance.dispatchAction({
    type: 'downplay',
    seriesIndex: 0
  })
}

// AI自动分析关系
const autoAnalyzeRelations = async () => {
  if (props.characters.length < 2) {
    ElMessage.warning('至少需要2个角色才能分析关系')
    return
  }
  
  showGraphDialog.value = true
  analyzing.value = true
  
  try {
    // 模拟AI分析
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const relationTypes = ['师徒', '朋友', '对手', '盟友', '亲人', '同事', '恋人']
    const newRelations = []
    
    // 生成角色间的关系
    for (let i = 0; i < props.characters.length; i++) {
      for (let j = i + 1; j < props.characters.length; j++) {
        // 随机决定是否建立关系 (70%概率)
        if (Math.random() > 0.3) {
          const char1 = props.characters[i]
          const char2 = props.characters[j]
          const relationType = relationTypes[Math.floor(Math.random() * relationTypes.length)]
          
          newRelations.push({
            id: `${char1.id}-${char2.id}-${Date.now()}-${Math.random()}`,
            sourceId: char1.id,
            sourceName: char1.name,
            targetId: char2.id,
            targetName: char2.name,
            type: relationType,
            strength: Math.floor(Math.random() * 5) + 1,
            createdAt: new Date().toISOString()
          })
        }
      }
    }
    
    relations.value = newRelations
    emit('update:relations', relations.value)
    ElMessage.success(`AI分析了 ${newRelations.length} 组角色关系`)
    
    // 初始化图表
    await nextTick()
    initChart()
  } catch (error) {
    ElMessage.error('关系分析失败')
    console.error(error)
  } finally {
    analyzing.value = false
  }
}

// 导出关系
const exportRelations = () => {
  const data = {
    characters: props.characters,
    relations: relations.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `角色关系_${new Date().toLocaleDateString()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('关系数据已导出')
}

// 清理图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

// 监听弹窗打开，初始化图表
const onDialogOpen = () => {
  if (relations.value.length > 0) {
    nextTick(() => {
      initChart()
    })
  }
}

// 监听弹窗
watch(showGraphDialog, (val) => {
  if (val) onDialogOpen()
})

// 清空关系
const clearRelations = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有角色关系吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    relations.value = []
    emit('update:relations', [])
    ElMessage.success('已清空所有关系')
  } catch {
    // 用户取消
  }
}

// 添加关系（供外部调用）
const addRelation = (relation) => {
  relations.value.push({
    id: `${relation.sourceId}-${relation.targetId}-${Date.now()}`,
    ...relation,
    createdAt: new Date().toISOString()
  })
  emit('update:relations', relations.value)
}

// 删除关系
const removeRelation = (relationId) => {
  relations.value = relations.value.filter(r => r.id !== relationId)
  emit('update:relations', relations.value)
}

// 暴露方法供父组件调用
defineExpose({
  addRelation,
  removeRelation,
  getRelations: () => relations.value,
  clearRelations
})
</script>

<style scoped>
.relationship-visualization {
  padding: 16px;
}

.relationship-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.relationship-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border-left: 3px solid #e2e8f0;
  transition: all 0.3s ease;
}

.relationship-node:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
}

.relationship-node.has-connections {
  border-left-color: #38bdf8;
}

.node-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.node-role {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.node-connections {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 200px;
}

.connection-item :deep(.el-tag) {
  border-radius: 4px;
}

.relationship-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  flex-wrap: wrap;
}

.relationship-stats {
  margin-top: 12px;
  text-align: center;
}

/* 关系类型颜色 */
.relation-type-师徒 :deep(.el-tag) {
  --el-tag-bg-color: rgba(251, 113, 133, 0.1);
  --el-tag-border-color: rgba(251, 113, 133, 0.3);
  --el-tag-text-color: #fb7185;
}

.relation-type-朋友 :deep(.el-tag) {
  --el-tag-bg-color: rgba(56, 189, 248, 0.1);
  --el-tag-border-color: rgba(56, 189, 248, 0.3);
  --el-tag-text-color: #38bdf8;
}

.relation-type-对手 :deep(.el-tag) {
  --el-tag-bg-color: rgba(239, 68, 68, 0.1);
  --el-tag-border-color: rgba(239, 68, 68, 0.3);
  --el-tag-text-color: #ef4444;
}

.relation-type-盟友 :deep(.el-tag) {
  --el-tag-bg-color: rgba(34, 197, 94, 0.1);
  --el-tag-border-color: rgba(34, 197, 94, 0.3);
  --el-tag-text-color: #22c55e;
}

.relation-type-亲人 :deep(.el-tag) {
  --el-tag-bg-color: rgba(168, 85, 247, 0.1);
  --el-tag-border-color: rgba(168, 85, 247, 0.3);
  --el-tag-text-color: #a855f7;
}

.relation-type-同事 :deep(.el-tag) {
  --el-tag-bg-color: rgba(245, 158, 11, 0.1);
  --el-tag-border-color: rgba(245, 158, 11, 0.3);
  --el-tag-text-color: #f59e0b;
}

.relation-type-恋人 :deep(.el-tag) {
  --el-tag-bg-color: rgba(236, 72, 153, 0.1);
  --el-tag-border-color: rgba(236, 72, 153, 0.3);
  --el-tag-text-color: #ec4899;
}
</style>
