<template>
  <div 
    class="app-layout" 
    :class="{ 
      'mobile': isMobile, 
      'tablet': isTablet,
      'immersive': isImmersive,
      'reading': isReadingMode
    }"
  >
    <!-- 顶部导航 -->
    <AppHeader 
      v-if="!hideHeader && !isImmersive" 
      :title="title"
      :show-back="showBack"
      :back-path="backPath"
      @back="handleBack"
    />
    
    <!-- 主体内容区 -->
    <main 
      class="main-content" 
      :class="contentClass"
      :style="contentStyle"
    >
      <slot />
    </main>
    
    <!-- 底部导航（仅移动端） -->
    <MobileNavBar 
      v-if="isMobile && !hideNav && !isImmersive" 
      :active="activeNav"
      @navigate="handleNav"
    />
    
    <!-- 阅读模式切换按钮（仅阅读页面） -->
    <div v-if="isReadingMode" class="reading-controls">
      <el-button 
        circle
        size="small"
        @click="toggleImmersive"
        :title="isImmersive ? '退出全屏' : '全屏阅读'"
      >
        <el-icon><FullScreen v-if="!isImmersive" /><Close v-else /></el-icon>
      </el-button>
      
      <el-button 
        circle
        size="small"
        @click="toggleTheme"
        :title="themeStore.isDark ? '切换亮色' : '切换暗色'"
      >
        <el-icon><Sunny v-if="themeStore.isDark" /><Moon v-else /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { FullScreen, Close, Sunny, Moon } from '@element-plus/icons-vue'
import { useThemeStore } from '../../stores/theme'
import AppHeader from './AppHeader.vue'
import MobileNavBar from './MobileNavBar.vue'

const props = defineProps({
  // 布局控制
  hideHeader: { type: Boolean, default: false },
  hideNav: { type: Boolean, default: false },
  title: { type: String, default: '' },
  showBack: { type: Boolean, default: false },
  backPath: { type: String, default: '' },
  contentClass: { type: String, default: '' },
  
  // 阅读模式
  isReadingMode: { type: Boolean, default: false },
  
  // 移动端导航
  activeNav: { type: String, default: '' }
})

const emit = defineEmits(['back', 'navigate'])

const router = useRouter()
const themeStore = useThemeStore()

// 响应式状态
const windowWidth = ref(window.innerWidth)
const isImmersive = ref(false)

const isMobile = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value > 768 && windowWidth.value <= 1024)

const contentStyle = computed(() => {
  if (isImmersive.value) {
    return {
      padding: '40px 60px',
      maxWidth: '800px',
      margin: '0 auto'
    }
  }
  return {}
})

// 方法
const handleBack = () => {
  if (props.backPath) {
    router.push(props.backPath)
  } else {
    router.back()
  }
  emit('back')
}

const handleNav = (path) => {
  emit('navigate', path)
  router.push(path)
}

const toggleImmersive = () => {
  isImmersive.value = !isImmersive.value
  if (isImmersive.value) {
    document.body.classList.add('immersive-mode')
  } else {
    document.body.classList.remove('immersive-mode')
  }
}

const toggleTheme = () => {
  themeStore.toggle()
}

// 监听窗口变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  themeStore.init()
  
  // ESC 退出沉浸模式
  const handleKeydown = (e) => {
    if (e.key === 'Escape' && isImmersive.value) {
      toggleImmersive()
    }
  }
  window.addEventListener('keydown', handleKeydown)
  
  // 清理
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('keydown', handleKeydown)
    document.body.classList.remove('immersive-mode')
  })
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  position: relative;
}

/* 沉浸式阅读模式 */
.app-layout.immersive {
  background: var(--bg-primary);
}

.app-layout.immersive .main-content {
  padding-top: 20px;
}

/* 阅读控制按钮 */
.reading-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: var(--z-sticky);
  opacity: 0.6;
  transition: opacity 0.3s;
}

.reading-controls:hover {
  opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .app-layout.mobile {
    padding-bottom: 60px; /* 为底部导航留空间 */
  }
  
  .reading-controls {
    top: auto;
    bottom: 80px;
    right: 16px;
  }
}
</style>
