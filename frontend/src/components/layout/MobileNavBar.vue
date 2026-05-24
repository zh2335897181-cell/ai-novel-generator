<template>
  <nav class="mobile-nav-bar">
    <div class="nav-items">
      <div 
        v-for="item in navItems" 
        :key="item.key"
        class="nav-item"
        :class="{ active: active === item.key }"
        @click="handleClick(item)"
      >
        <el-badge 
          v-if="item.badge" 
          :value="item.badge" 
          class="nav-badge"
        >
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </el-badge>
        <el-icon v-else :size="22"><component :is="item.icon" /></el-icon>
        <span class="nav-label">{{ item.label }}</span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import {
  Reading, Document, User, Setting,
  Menu, House, MagicStick, Collection
} from '@element-plus/icons-vue'

const props = defineProps({
  active: { type: String, default: '' },
  novelId: { type: [String, Number], default: null },
  customItems: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate', 'select'])

// 默认导航项
const defaultNavItems = [
  { key: 'home', label: '首页', icon: House, path: '/' },
  { key: 'novels', label: '小说', icon: Reading, path: '/novels' },
  { key: 'bookshelf', label: '书架', icon: Collection, path: '/bookshelf' },
  { key: 'generate', label: '生成', icon: MagicStick, path: null },
  { key: 'settings', label: '设置', icon: Setting, path: '/ai-config' }
]

const navItems = computed(() => {
  if (props.customItems.length > 0) {
    return props.customItems
  }
  return defaultNavItems
})

const handleClick = (item) => {
  if (item.path) {
    emit('navigate', item.path)
  } else {
    emit('select', item.key)
  }
}
</script>

<style scoped>
.mobile-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(var(--blur-xl)) saturate(1.8);
  -webkit-backdrop-filter: blur(var(--blur-xl)) saturate(1.8);
  border-top: 1px solid var(--border-glass);
  box-shadow: 0 -2px 20px rgba(0,0,0,0.04);
  z-index: var(--z-sticky);
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-items {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 14px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all var(--transition-spring);
  border-radius: var(--radius-md);
  position: relative;
}

.nav-item:active { transform: scale(0.9); }

.nav-item.active {
  color: var(--primary);
  background: var(--gradient-primary-subtle);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 20%;
  right: 20%;
  height: 3px;
  background: var(--gradient-primary);
  border-radius: 0 0 3px 3px;
}

.nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; }

.nav-badge :deep(.el-badge__content) {
  transform: translate(30%, -30%) scale(0.8);
}
</style>
