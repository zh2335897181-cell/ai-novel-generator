import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 主题管理 Store
 * 支持: 亮色 / 暗色 / 自动跟随系统
 */
export const useThemeStore = defineStore('theme', () => {
  // 状态
  const mode = ref(localStorage.getItem('theme-mode') || 'dark')
  const systemDark = ref(false)

  // 计算属性
  const isDark = computed(() => {
    if (mode.value === 'auto') {
      return systemDark.value
    }
    return mode.value === 'dark'
  })

  const currentMode = computed(() => {
    if (mode.value === 'auto') {
      return systemDark.value ? 'dark' : 'light'
    }
    return mode.value
  })

  // 方法
  const init = () => {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      systemDark.value = e.matches
      applyTheme()
    })

    applyTheme()
  }

  const applyTheme = () => {
    const theme = currentMode.value
    document.documentElement.setAttribute('data-theme', theme)
    
    // 为 Element Plus 设置暗色类
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  const setMode = (newMode) => {
    mode.value = newMode
    localStorage.setItem('theme-mode', newMode)
    applyTheme()
  }

  const toggle = () => {
    const modes = ['light', 'dark', 'auto']
    const currentIndex = modes.indexOf(mode.value)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setMode(nextMode)
  }

  const setLight = () => setMode('light')
  const setDark = () => setMode('dark')
  const setAuto = () => setMode('auto')

  // 监听变化
  watch(mode, applyTheme, { immediate: true })

  return {
    mode,
    isDark,
    currentMode,
    init,
    setMode,
    toggle,
    setLight,
    setDark,
    setAuto
  }
})
