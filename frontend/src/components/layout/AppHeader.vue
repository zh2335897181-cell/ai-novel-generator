<template>
  <header class="app-header" :class="{ 'mobile': isMobile }">
    <div class="header-content">
      <!-- 左侧：返回按钮 + 标题 -->
      <div class="header-left">
        <el-button 
          v-if="showBack" 
          text 
          class="back-btn"
          @click="$emit('back')"
        >
          <el-icon><ArrowLeft /></el-icon>
          <span v-if="!isMobile">返回</span>
        </el-button>
        
        <div class="title-section">
          <h1 v-if="title" class="page-title">{{ title }}</h1>
          <slot name="title" />
        </div>
      </div>
      
      <!-- 右侧：操作区 -->
      <div class="header-right">
        <slot name="actions" />
        
        <!-- 主题切换 -->
        <el-button
          v-if="showThemeToggle"
          class="theme-btn"
          @click="toggleTheme"
          size="small"
        >
          <el-icon><Sunny v-if="!themeStore.isDark" /><Moon v-else /></el-icon>
          <span>{{ themeStore.isDark ? '黑底白字' : '白底黑字' }}</span>
        </el-button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft, Sunny, Moon } from '@element-plus/icons-vue'
import { useThemeStore } from '../../stores/theme'

const props = defineProps({
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  showThemeToggle: { type: Boolean, default: true }
})

defineEmits(['back'])

const themeStore = useThemeStore()

const isMobile = computed(() => window.innerWidth <= 768)

const toggleTheme = () => {
  themeStore.toggle()
}
</script>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(var(--blur-xl)) saturate(1.8);
  -webkit-backdrop-filter: blur(var(--blur-xl)) saturate(1.8);
  border-bottom: 1px solid var(--border-glass);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header-left { display: flex; align-items: center; gap: 16px; flex: 1; min-width: 0; }

.back-btn {
  font-size: var(--text-sm);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.back-btn:hover {
  background: var(--gradient-primary-subtle) !important;
}

.page-title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }

.theme-btn {
  font-size: 13px;
  transition: all var(--transition-fast);
}
.theme-btn:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .header-content { padding: 10px 16px; }
  .page-title { font-size: var(--text-base); }
  .back-btn span { display: none; }
}
</style>
