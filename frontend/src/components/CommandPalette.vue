<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="command-palette-overlay" @click="close">
        <div class="command-palette" @click.stop>
          <div class="command-input-wrapper">
            <el-icon :size="20" class="search-icon"><Search /></el-icon>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              class="command-input"
              placeholder="搜索命令或功能..."
              @keydown="handleKeydown"
            />
            <kbd class="shortcut-hint">ESC</kbd>
          </div>
          
          <div class="command-list">
            <div
              v-for="(group, groupIndex) in filteredGroups"
              :key="group.name"
              class="command-group"
            >
              <div class="group-title">{{ group.name }}</div>
              <div
                v-for="(command, cmdIndex) in group.commands"
                :key="command.id"
                class="command-item"
                :class="{ active: isActiveCommand(groupIndex, cmdIndex) }"
                @click="executeCommand(command)"
                @mouseenter="setActiveIndex(groupIndex, cmdIndex)"
              >
                <el-icon :size="18" class="command-icon">
                  <component :is="command.icon" />
                </el-icon>
                <span class="command-name">{{ command.name }}</span>
                <span v-if="command.shortcut" class="command-shortcut">
                  <kbd v-for="key in command.shortcut" :key="key">{{ key }}</kbd>
                </span>
              </div>
            </div>
            
            <div v-if="isEmpty" class="empty-state">
              <el-icon :size="32"><Search /></el-icon>
              <p>未找到匹配的命令</p>
            </div>
          </div>
          
          <div class="command-footer">
            <span class="footer-hint">
              <kbd>↑</kbd><kbd>↓</kbd> 导航
            </span>
            <span class="footer-hint">
              <kbd>Enter</kbd> 执行
            </span>
            <span class="footer-hint">
              <kbd>ESC</kbd> 关闭
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search, House, Document, User, Setting, Moon, Sunny,
  FullScreen, ArrowLeft, Plus, Download, MagicStick,
  OfficeBuilding, Box, Location, TrendCharts, Share,
  Reading, Timer
} from '@element-plus/icons-vue'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '../stores/user'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'execute'])

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const userStore = useUserStore()

const inputRef = ref(null)
const searchQuery = ref('')
const activeGroupIndex = ref(0)
const activeCmdIndex = ref(0)

// 命令分组定义
const commandGroups = computed(() => [
  {
    name: '导航',
    commands: [
      { id: 'home', name: '返回首页', icon: House, action: () => router.push('/novels'), shortcut: ['G', 'H'] },
      { id: 'landing', name: '宣传页面', icon: Reading, action: () => router.push('/'), shortcut: ['G', 'L'] },
      { id: 'back', name: '返回上一页', icon: ArrowLeft, action: () => router.back(), shortcut: ['Alt', '←'] },
    ]
  },
  {
    name: '小说创作',
    commands: [
      { id: 'generate', name: '生成章节内容', icon: MagicStick, action: () => emit('execute', 'generate'), shortcut: ['Ctrl', 'S'] },
      { id: 'world', name: '编辑世界设定', icon: OfficeBuilding, action: () => emit('execute', 'world') },
      { id: 'character', name: '添加角色', icon: User, action: () => emit('execute', 'character') },
      { id: 'chapter', name: '生成章节大纲', icon: Document, action: () => emit('execute', 'chapter') },
      { id: 'timeline', name: '时间线管理', icon: Timer, action: () => emit('execute', 'timeline') },
    ]
  },
  {
    name: '视图',
    commands: [
      { id: 'theme', name: themeStore.isDark ? '切换亮色模式' : '切换暗色模式', icon: themeStore.isDark ? Sunny : Moon, action: toggleTheme, shortcut: ['Ctrl', 'Shift', 'L'] },
      { id: 'sidebar', name: '切换侧边栏', icon: FullScreen, action: () => emit('execute', 'toggleSidebar'), shortcut: ['Ctrl', 'B'] },
      { id: 'immersive', name: '沉浸阅读模式', icon: Reading, action: () => emit('execute', 'immersive') },
    ]
  },
  {
    name: '导出',
    commands: [
      { id: 'export-docx', name: '导出 Word 文档', icon: Document, action: () => emit('execute', 'export-docx') },
      { id: 'export-txt', name: '导出 TXT 文本', icon: Download, action: () => emit('execute', 'export-txt') },
      { id: 'export-md', name: '导出 Markdown', icon: Document, action: () => emit('execute', 'export-md') },
      { id: 'share', name: '生成分享海报', icon: Share, action: () => emit('execute', 'share') },
    ]
  },
  {
    name: '设置',
    commands: [
      { id: 'ai-config', name: 'AI 配置', icon: Setting, action: () => router.push('/ai-config') },
      { id: 'unlock', name: '解锁全部功能', icon: MagicStick, action: () => userStore.unlockWithShortcut(), shortcut: ['Ctrl', 'Shift', 'U'] },
    ]
  }
])

// 过滤后的命令组
const filteredGroups = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return commandGroups.value
  
  return commandGroups.value.map(group => ({
    ...group,
    commands: group.commands.filter(cmd => 
      cmd.name.toLowerCase().includes(query) ||
      cmd.id.toLowerCase().includes(query)
    )
  })).filter(group => group.commands.length > 0)
})

const isEmpty = computed(() => filteredGroups.value.length === 0)

// 当前激活的命令
const currentActiveCommand = computed(() => {
  const groups = filteredGroups.value
  if (groups.length === 0) return null
  
  const group = groups[activeGroupIndex.value]
  if (!group || group.commands.length === 0) return null
  
  return group.commands[activeCmdIndex.value] || null
})

// 监听可见性变化
watch(() => props.visible, (val) => {
  if (val) {
    searchQuery.value = ''
    activeGroupIndex.value = 0
    activeCmdIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// 监听搜索结果变化，重置激活索引
watch(filteredGroups, () => {
  activeGroupIndex.value = 0
  activeCmdIndex.value = 0
})

function close() {
  emit('update:visible', false)
}

function toggleTheme() {
  themeStore.toggle()
}

function setActiveIndex(groupIdx, cmdIdx) {
  activeGroupIndex.value = groupIdx
  activeCmdIndex.value = cmdIdx
}

function isActiveCommand(groupIdx, cmdIdx) {
  return activeGroupIndex.value === groupIdx && activeCmdIndex.value === cmdIdx
}

function handleKeydown(e) {
  const groups = filteredGroups.value
  
  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      close()
      break
    case 'ArrowDown':
      e.preventDefault()
      navigateDown(groups)
      break
    case 'ArrowUp':
      e.preventDefault()
      navigateUp(groups)
      break
    case 'Enter':
      e.preventDefault()
      if (currentActiveCommand.value) {
        executeCommand(currentActiveCommand.value)
      }
      break
  }
}

function navigateDown(groups) {
  const currentGroup = groups[activeGroupIndex.value]
  if (!currentGroup) return
  
  if (activeCmdIndex.value < currentGroup.commands.length - 1) {
    activeCmdIndex.value++
  } else if (activeGroupIndex.value < groups.length - 1) {
    activeGroupIndex.value++
    activeCmdIndex.value = 0
  } else {
    // 循环到第一个
    activeGroupIndex.value = 0
    activeCmdIndex.value = 0
  }
}

function navigateUp(groups) {
  if (activeCmdIndex.value > 0) {
    activeCmdIndex.value--
  } else if (activeGroupIndex.value > 0) {
    activeGroupIndex.value--
    const prevGroup = groups[activeGroupIndex.value]
    activeCmdIndex.value = prevGroup.commands.length - 1
  } else {
    // 循环到最后一个
    const lastGroupIdx = groups.length - 1
    const lastGroup = groups[lastGroupIdx]
    activeGroupIndex.value = lastGroupIdx
    activeCmdIndex.value = lastGroup.commands.length - 1
  }
}

function executeCommand(command) {
  close()
  setTimeout(() => {
    command.action()
  }, 100)
}
</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.command-palette {
  width: 100%;
  max-width: 600px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  border: 1px solid var(--border);
}

.command-input-wrapper {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.command-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
}

.command-input::placeholder {
  color: var(--text-muted);
}

.shortcut-hint {
  background: var(--bg-glass);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
  font-family: monospace;
}

.command-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.command-group {
  margin-bottom: 8px;
}

.group-title {
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.command-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  gap: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.command-item:hover,
.command-item.active {
  background: var(--bg-glass);
}

.command-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.command-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.command-shortcut {
  display: flex;
  gap: 4px;
}

.command-shortcut kbd {
  background: var(--bg-glass-strong);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  font-family: monospace;
  border: 1px solid var(--border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: var(--text-muted);
  gap: 12px;
}

.empty-state p {
  font-size: 14px;
}

.command-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-glass);
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.footer-hint kbd {
  background: var(--bg-glass-strong);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  border: 1px solid var(--border);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .command-palette,
.fade-leave-active .command-palette {
  transition: transform var(--transition-base), opacity var(--transition-base);
}

.fade-enter-from .command-palette,
.fade-leave-to .command-palette {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}
</style>
