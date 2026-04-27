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
  Menu, House, MagicStick 
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
  height: 60px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--border);
  z-index: var(--z-sticky);
  padding-bottom: env(safe-area-inset-bottom); /* iPhone 安全区 */
}

.nav-items {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 16px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  border-radius: 12px;
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-item.active {
  color: var(--primary);
}

.nav-item.active .el-icon {
  filter: drop-shadow(0 0 8px var(--primary-glow));
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
}

.nav-badge :deep(.el-badge__content) {
  transform: translate(30%, -30%) scale(0.8);
}
</style>
