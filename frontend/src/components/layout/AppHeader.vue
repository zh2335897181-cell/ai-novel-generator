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
          text
          circle
          class="theme-btn"
          @click="toggleTheme"
        >
          <el-icon>
            <Sunny v-if="themeStore.isDark" />
            <Moon v-else />
          </el-icon>
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
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.back-btn {
  font-size: 14px;
  padding: 8px 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.theme-btn {
  font-size: 18px;
  color: var(--text-secondary);
}

.theme-btn:hover {
  color: var(--primary);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content {
    padding: 10px 16px;
  }
  
  .page-title {
    font-size: 17px;
  }
  
  .back-btn span {
    display: none;
  }
}
</style>
