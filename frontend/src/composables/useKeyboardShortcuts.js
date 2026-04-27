import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '../stores/theme'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'

/**
 * 键盘快捷键管理 Composable
 * 
 * 支持的快捷键：
 * - Ctrl+K: 打开命令面板
 * - Ctrl+S: 保存/生成（小说详情页）
 * - Ctrl+B: 切换侧边栏
 * - Ctrl+Shift+L: 切换主题
 * - Ctrl+Shift+U: 解锁全部功能（已存在）
 * - Esc: 关闭命令面板
 */
export function useKeyboardShortcuts(options = {}) {
  const route = useRoute()
  const themeStore = useThemeStore()
  const userStore = useUserStore()
  
  const {
    onOpenCommandPalette,
    onGenerate,
    onToggleSidebar,
    onToggleImmersive,
    onExport
  } = options

  let isCommandPaletteOpen = false

  const setCommandPaletteState = (state) => {
    isCommandPaletteOpen = state
  }

  const handleKeyDown = (e) => {
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    const isAlt = e.altKey

    // 如果在输入框中，只响应特定快捷键
    const isInput = e.target.tagName === 'INPUT' || 
                    e.target.tagName === 'TEXTAREA' ||
                    e.target.contentEditable === 'true'

    // Ctrl+K: 打开命令面板（最高优先级，任何地方都可用）
    if (isCtrl && e.key === 'k' && !isShift) {
      e.preventDefault()
      if (onOpenCommandPalette) {
        onOpenCommandPalette()
      }
      return
    }

    // 如果命令面板打开，交给面板处理
    if (isCommandPaletteOpen) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenCommandPalette?.(false)
      }
      return
    }

    // 在输入框中只响应 Escape 和高优先级快捷键
    if (isInput) {
      // Ctrl+Shift+U: 解锁（已存在的功能）
      if (isCtrl && isShift && e.key === 'U') {
        e.preventDefault()
        userStore.unlockWithShortcut()
      }
      return
    }

    // ===== 全局快捷键 =====
    
    // Ctrl+Shift+L: 切换主题
    if (isCtrl && isShift && e.key === 'L') {
      e.preventDefault()
      themeStore.toggle()
      ElMessage.success(`已切换至${themeStore.isDark ? '暗色' : '亮色'}模式`)
      return
    }

    // Ctrl+Shift+U: 解锁全部功能
    if (isCtrl && isShift && e.key === 'U') {
      e.preventDefault()
      userStore.unlockWithShortcut()
      return
    }

    // ===== 小说详情页快捷键 =====
    const isNovelDetail = route.name === 'NovelDetail'
    
    if (isNovelDetail) {
      // Ctrl+S: 生成/保存
      if (isCtrl && e.key === 's' && !isShift) {
        e.preventDefault()
        if (onGenerate) {
          onGenerate()
        } else {
          // 如果没有回调，尝试触发生成按钮点击
          const generateBtn = document.querySelector('[data-shortcut="generate"]')
          if (generateBtn) {
            generateBtn.click()
          }
        }
        return
      }

      // Ctrl+B: 切换侧边栏
      if (isCtrl && e.key === 'b' && !isShift) {
        e.preventDefault()
        if (onToggleSidebar) {
          onToggleSidebar()
        }
        return
      }

      // Alt+Enter 或 F11: 沉浸式阅读模式
      if ((isAlt && e.key === 'Enter') || e.key === 'F11') {
        e.preventDefault()
        if (onToggleImmersive) {
          onToggleImmersive()
        }
        return
      }

      // Ctrl+E: 导出菜单
      if (isCtrl && e.key === 'e' && !isShift) {
        e.preventDefault()
        if (onExport) {
          onExport()
        }
        return
      }
    }

    // ===== 导航快捷键 =====
    
    // Alt+←: 返回上一页
    if (isAlt && e.key === 'ArrowLeft') {
      e.preventDefault()
      window.history.back()
      return
    }

    // Alt+→: 前进
    if (isAlt && e.key === 'ArrowRight') {
      e.preventDefault()
      window.history.forward()
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    setCommandPaletteState
  }
}
