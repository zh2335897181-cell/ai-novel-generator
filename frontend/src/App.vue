<template>
  <div id="app">
    <AnnouncementBar />
    <router-view />
    <CookieConsent />
    <FeedbackDialog />
    <CommandPalette v-model:visible="commandPaletteVisible" @execute="handleCommandExecute" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import { useThemeStore } from './stores/theme'
import CookieConsent from './components/CookieConsent.vue'
import FeedbackDialog from './components/FeedbackDialog.vue'
import CommandPalette from './components/CommandPalette.vue'
import AnnouncementBar from './components/AnnouncementBar.vue'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()

// 命令面板状态
const commandPaletteVisible = ref(false)

// 当前页面命令执行回调
const currentPageCallbacks = ref({})

// 提供命令执行回调注册机制
provide('registerCommandCallbacks', (callbacks) => {
  currentPageCallbacks.value = callbacks
})

provide('unregisterCommandCallbacks', () => {
  currentPageCallbacks.value = {}
})

// 打开命令面板
const openCommandPalette = () => {
  commandPaletteVisible.value = true
}

// 处理命令执行
const handleCommandExecute = (command) => {
  const callbacks = currentPageCallbacks.value
  
  switch (command) {
    case 'generate':
      callbacks.onGenerate?.()
      break
    case 'world':
      callbacks.onShowWorldDialog?.()
      break
    case 'character':
      callbacks.onShowCharacterDialog?.()
      break
    case 'chapter':
      callbacks.onShowChapterDialog?.()
      break
    case 'timeline':
      callbacks.onShowTimeline?.()
      break
    case 'toggleSidebar':
      callbacks.onToggleSidebar?.()
      break
    case 'immersive':
      callbacks.onToggleImmersive?.()
      break
    case 'export-docx':
      callbacks.onExportDocx?.()
      break
    case 'export-txt':
      callbacks.onExportTxt?.()
      break
    case 'export-md':
      callbacks.onExportMd?.()
      break
    case 'share':
      callbacks.onShare?.()
      break
  }
}

// 使用键盘快捷键 composable
const { setCommandPaletteState } = useKeyboardShortcuts({
  onOpenCommandPalette: (show = true) => {
    commandPaletteVisible.value = show
  }
})

// 监听命令面板状态
watch(commandPaletteVisible, (val) => {
  setCommandPaletteState(val)
})

// 原有的键盘快捷键（保留 Ctrl+Shift+U 作为后备）
const legacyKeyDown = (e) => {
  // Ctrl+Shift+U 解锁快捷键
  if (e.ctrlKey && e.shiftKey && e.key === 'U') {
    e.preventDefault()
    userStore.unlockWithShortcut()
  }
}

onMounted(() => {
  window.addEventListener('keydown', legacyKeyDown)
  
  // 恢复登录状态
  userStore.fetchUserInfo()
  
  // 恢复游客模式状态
  const guestMode = localStorage.getItem('guestMode')
  if (guestMode === 'true') {
    userStore.setGuestMode(true)
  }
  
  // 检查解锁状态
  userStore.checkUnlockStatus()
  
  // 初始化主题
  themeStore.init()
})

onUnmounted(() => {
  window.removeEventListener('keydown', legacyKeyDown)
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');
@import './styles/print.css';

/* ===== Design System - Pro Max Premium Edition ===== */
:root {
  /* Z-Index 层级系统 */
  --z-base: 1;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-drawer: 300;
  --z-modal: 1000;
  --z-popover: 1100;
  --z-tooltip: 1200;
  --z-toast: 1300;
  --z-notification: 1400;
  --z-overlay: 1500;
  --z-dialog: 1600;
  --z-max: 9999;

  /* Primary palette - Refined Pro Max */
  --primary-50: #fff1f2;
  --primary-100: #ffe4e6;
  --primary-200: #fecdd3;
  --primary-300: #fda4af;
  --primary-400: #fb7185;
  --primary-500: #f43f5e;
  --primary-600: #e11d48;
  --primary-700: #be123c;
  --primary-800: #9f1239;
  --primary-900: #881337;

  --accent-50: #f0f9ff;
  --accent-100: #e0f2fe;
  --accent-200: #bae6fd;
  --accent-300: #7dd3fc;
  --accent-400: #38bdf8;
  --accent-500: #0ea5e9;
  --accent-600: #0284c7;
  --accent-700: #0369a1;
  --accent-800: #075985;
  --accent-900: #0c4a6e;

  /* Shortcut aliases */
  --primary: #f43f5e;
  --primary-light: #fecdd3;
  --primary-dark: #be123c;
  --primary-glow: rgba(244, 63, 94, 0.35);
  --accent: #38bdf8;
  --accent-light: #bae6fd;
  --accent-dark: #0284c7;
  --accent-glow: rgba(56, 189, 248, 0.35);

  /* Premium Gradients */
  --gradient-primary: linear-gradient(135deg, #f43f5e 0%, #38bdf8 45%, #a855f7 100%);
  --gradient-primary-subtle: linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(56,189,248,0.08) 100%);
  --gradient-accent: linear-gradient(135deg, #4ade80 0%, #38bdf8 45%, #f43f5e 100%);
  --gradient-warm: linear-gradient(135deg, #fbbf24 0%, #f43f5e 100%);
  --gradient-success: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  --gradient-dark: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  --gradient-gold: linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%);
  --gradient-card: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%);

  /* Background - Soft ethereal clouds */
  --gradient-bg: radial-gradient(ellipse at 0% 0%, #e0f2fe 0%, #fdf2ff 30%, #fefce8 60%, #f8fafc 100%);
  --gradient-bg-warm: radial-gradient(ellipse at 100% 0%, #ffe4e6 0%, #fdf2ff 35%, #fefce8 70%, #f8fafc 100%);

  /* Backgrounds */
  --bg-deep: #f1f5f9;
  --bg-page: #f8fafc;
  --bg-primary: rgba(255, 255, 255, 0.88);
  --bg-secondary: rgba(255, 255, 255, 0.92);
  --bg-elevated: rgba(255, 255, 255, 0.97);
  --bg-card: rgba(255, 255, 255, 0.88);
  --bg-card-hover: rgba(255, 255, 255, 0.98);
  --bg-glass: rgba(255, 255, 255, 0.72);
  --bg-glass-strong: rgba(255, 255, 255, 0.88);
  --bg-input: rgba(248, 250, 252, 0.92);
  --bg-surface: #ffffff;
  --bg-float: rgba(255, 255, 255, 0.95);

  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-accent: #f43f5e;
  --text-inverse: #ffffff;

  /* Status */
  --success: #10b981;
  --success-light: #d1fae5;
  --warning: #f59e0b;
  --warning-light: #fef3c7;
  --danger: #ef4444;
  --danger-light: #fee2e2;
  --info: #3b82f6;
  --info-light: #dbeafe;

  /* Borders */
  --border: rgba(226, 232, 240, 0.6);
  --border-light: rgba(226, 232, 240, 0.4);
  --border-strong: rgba(203, 213, 225, 0.8);
  --border-accent: rgba(244, 63, 94, 0.25);
  --border-glass: rgba(255, 255, 255, 0.5);

  /* Radius - Refined scale */
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-3xl: 36px;
  --radius-full: 9999px;

  /* Shadows - Multi-layer depth system */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.07), 0 4px 10px rgba(0,0,0,0.04);
  --shadow-xl: 0 20px 50px rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.05);
  --shadow-2xl: 0 25px 60px rgba(0,0,0,0.12), 0 10px 30px rgba(0,0,0,0.06);
  --shadow-glow: 0 0 40px var(--primary-glow);
  --shadow-accent-glow: 0 0 40px var(--accent-glow);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05);
  --shadow-card-hover: 0 4px 8px rgba(0,0,0,0.06), 0 12px 30px rgba(0,0,0,0.08);
  --shadow-button: 0 2px 8px rgba(244,63,94,0.25);
  --shadow-input: 0 0 0 3px rgba(244,63,94,0.12);

  /* Transitions - Premium easing */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring-soft: cubic-bezier(0.4, 1.4, 0.6, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 250ms var(--ease-out);
  --transition-slow: 400ms var(--ease-out-expo);
  --transition-spring: 400ms var(--ease-spring);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 80px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-display: 'Noto Sans SC', 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Blur levels */
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 24px;
  --blur-xl: 40px;
}

/* ===== Dark Mode Overrides ===== */
[data-theme="dark"] {
  --gradient-bg: radial-gradient(ellipse at 0% 0%, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #0d1117 100%);
  --gradient-bg-warm: radial-gradient(ellipse at 100% 0%, #1a1a2e 0%, #16213e 35%, #0f3460 70%, #0d1117 100%);

  --bg-deep: #0d1117;
  --bg-page: #0d1117;
  --bg-primary: rgba(22, 27, 34, 0.88);
  --bg-secondary: rgba(22, 27, 34, 0.92);
  --bg-elevated: rgba(22, 27, 34, 0.97);
  --bg-card: rgba(22, 27, 34, 0.88);
  --bg-card-hover: rgba(22, 27, 34, 0.98);
  --bg-glass: rgba(22, 27, 34, 0.72);
  --bg-glass-strong: rgba(22, 27, 34, 0.88);
  --bg-input: rgba(13, 17, 23, 0.92);
  --bg-surface: #161b22;
  --bg-float: rgba(22, 27, 34, 0.95);

  --text-primary: #e6edf3;
  --text-secondary: #c9d1d9;
  --text-muted: #8b949e;
  --text-inverse: #0d1117;

  --border: rgba(48, 54, 61, 0.6);
  --border-light: rgba(48, 54, 61, 0.4);
  --border-strong: rgba(48, 54, 61, 0.8);
  --border-glass: rgba(48, 54, 61, 0.5);

  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 25px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.3);
  --shadow-xl: 0 20px 50px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.35);
  --shadow-2xl: 0 25px 60px rgba(0,0,0,0.55), 0 10px 30px rgba(0,0,0,0.4);

  color-scheme: dark;
}

/* ===== Global Reset ===== */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-tap-highlight-color: transparent;
}

body {
  background: var(--bg-page);
  color: var(--text-primary);
  overflow-x: hidden;
  font-family: var(--font-display);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===== Premium Scrollbar ===== */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--primary-300), var(--accent-300));
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--primary-400), var(--accent-400));
}

/* ===== App Container ===== */
#app {
  font-family: var(--font-display);
  min-height: 100vh;
  background: var(--gradient-bg);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

/* ===== Page Transitions ===== */
.fade-slide-enter-active {
  transition: all 0.35s var(--ease-out-expo);
}
.fade-slide-leave-active {
  transition: all 0.2s var(--ease-out);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===== Page enter animation ===== */
.page-enter {
  animation: pageIn 0.4s var(--ease-out-expo) both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Element Plus Pro Max Overrides ===== */

/* Button - Premium */
.el-button {
  border-radius: var(--radius-sm) !important;
  font-weight: 500;
  font-family: inherit;
  transition: all var(--transition-fast);
  letter-spacing: 0.01em;
}
.el-button:not(.el-button--primary):not(.el-button--danger):not(.el-button--warning):not(.el-button--success) {
  background: var(--bg-glass) !important;
  border: 1px solid var(--border) !important;
  color: var(--text-primary) !important;
  backdrop-filter: blur(var(--blur-sm));
}
.el-button:not(.el-button--primary):not(.el-button--danger):not(.el-button--warning):not(.el-button--success):hover {
  background: var(--bg-glass-strong) !important;
  border-color: var(--border-strong) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.el-button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: white !important;
  font-weight: 600;
  box-shadow: var(--shadow-button);
}
.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow), var(--shadow-button);
}
.el-button--primary:active {
  transform: translateY(0);
}
.el-button--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(239,68,68,0.25);
}
.el-button--danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239,68,68,0.35);
}
.el-button--warning {
  background: var(--gradient-warm) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(245,158,11,0.25);
}
.el-button--success {
  background: var(--gradient-success) !important;
  border: none !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(16,185,129,0.25);
}
.el-button.is-plain {
  background: transparent !important;
  border: 1.5px solid currentColor !important;
}

/* Dialog - Premium Glass */
.el-dialog {
  border-radius: var(--radius-2xl) !important;
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(var(--blur-xl));
  -webkit-backdrop-filter: blur(var(--blur-xl));
  border: 1px solid var(--border-glass) !important;
  box-shadow: var(--shadow-2xl), 0 0 0 1px rgba(255,255,255,0.5) inset !important;
  overflow: hidden;
}
.el-dialog__header {
  background: linear-gradient(180deg, var(--bg-elevated) 0%, transparent 100%) !important;
  padding: 24px 28px !important;
  border-bottom: 1px solid var(--border-light) !important;
}
.el-dialog__title {
  color: var(--text-primary) !important;
  font-weight: 700 !important;
  font-size: var(--text-lg) !important;
  letter-spacing: -0.01em;
}
.el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted) !important;
  transition: all var(--transition-fast);
}
.el-dialog__headerbtn .el-dialog__close:hover {
  color: var(--text-primary) !important;
  transform: rotate(90deg);
}
.el-dialog__body {
  padding: 24px 28px !important;
  color: var(--text-primary) !important;
}
.el-dialog__footer {
  padding: 20px 28px !important;
  border-top: 1px solid var(--border-light) !important;
  background: linear-gradient(0deg, var(--bg-elevated) 0%, transparent 100%) !important;
}

/* Form */
.el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: 600;
  font-size: var(--text-sm);
}

/* Input - Premium */
.el-input__wrapper,
.el-textarea__inner {
  background: var(--bg-input) !important;
  border: 1.5px solid var(--border) !important;
  box-shadow: var(--shadow-xs) !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast);
}
.el-input__wrapper:hover,
.el-textarea__inner:hover {
  border-color: var(--border-strong) !important;
  box-shadow: var(--shadow-sm) !important;
}
.el-input__wrapper.is-focus,
.el-textarea__inner:focus {
  border-color: var(--primary-400) !important;
  box-shadow: var(--shadow-input) !important;
}
.el-input__inner {
  color: var(--text-primary) !important;
}
.el-input__inner::placeholder,
.el-textarea__inner::placeholder {
  color: var(--text-muted) !important;
}

/* Select - Premium */
.el-select__wrapper {
  background: var(--bg-input) !important;
  border: 1.5px solid var(--border) !important;
  box-shadow: var(--shadow-xs) !important;
  border-radius: var(--radius-sm) !important;
  transition: all var(--transition-fast);
}
.el-select__wrapper:hover {
  border-color: var(--border-strong) !important;
}
.el-select-dropdown {
  background: var(--bg-float) !important;
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-glass) !important;
  border-radius: var(--radius-md) !important;
  box-shadow: var(--shadow-xl) !important;
  overflow: hidden;
}
.el-select-dropdown__item {
  color: var(--text-primary) !important;
  transition: all var(--transition-fast);
}
.el-select-dropdown__item.is-hovering {
  background: var(--gradient-primary-subtle) !important;
}
.el-select-dropdown__item.is-selected {
  color: var(--primary) !important;
  font-weight: 600;
}

/* Card - Premium Glass */
.el-card {
  background: var(--bg-card) !important;
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-glass) !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-card) !important;
  color: var(--text-primary) !important;
  transition: all var(--transition-base);
}
.el-card:hover {
  box-shadow: var(--shadow-card-hover);
}
.el-card__header {
  border-bottom: 1px solid var(--border-light) !important;
  color: var(--text-primary) !important;
  padding: 18px 24px !important;
  font-weight: 600;
}
.el-card__body {
  color: var(--text-primary) !important;
}

/* Tag - Premium Pills */
.el-tag {
  border-radius: var(--radius-full) !important;
  border: none !important;
  font-weight: 500;
  letter-spacing: 0.01em;
}
.el-tag--success {
  background: var(--success-light) !important;
  color: #059669 !important;
}
.el-tag--warning {
  background: var(--warning-light) !important;
  color: #d97706 !important;
}
.el-tag--danger {
  background: var(--danger-light) !important;
  color: #dc2626 !important;
}
.el-tag--info {
  background: #f1f5f9 !important;
  color: #64748b !important;
}
.el-tag--primary {
  background: var(--primary-100) !important;
  color: var(--primary-600) !important;
}

/* Slider */
.el-slider__runway {
  background: #e2e8f0 !important;
  height: 6px !important;
  border-radius: var(--radius-full) !important;
}
.el-slider__bar {
  background: var(--gradient-primary) !important;
  height: 6px !important;
  border-radius: var(--radius-full) !important;
}
.el-slider__button {
  width: 20px !important;
  height: 20px !important;
  border: 3px solid var(--primary) !important;
  background: white !important;
  box-shadow: var(--shadow-md) !important;
  transition: all var(--transition-fast);
}
.el-slider__button:hover {
  transform: scale(1.15);
  box-shadow: var(--shadow-lg) !important;
}

/* Empty */
.el-empty__description p {
  color: var(--text-muted) !important;
}

/* Collapse */
.el-collapse {
  border: none !important;
}
.el-collapse-item__header {
  background: transparent !important;
  border-bottom: 1px solid var(--border-light) !important;
  color: var(--text-primary) !important;
  font-weight: 600;
  transition: all var(--transition-fast);
}
.el-collapse-item__header:hover {
  color: var(--primary) !important;
}
.el-collapse-item__wrap {
  background: transparent !important;
  border-bottom: 1px solid var(--border-light) !important;
}

/* Badge */
.el-badge__content {
  border: 2px solid white !important;
}

/* Alert */
.el-alert {
  border-radius: var(--radius-md) !important;
  border: none !important;
}
.el-alert--info {
  background: var(--info-light) !important;
}
.el-alert--info .el-alert__title {
  color: var(--info) !important;
}
.el-alert--success {
  background: var(--success-light) !important;
}
.el-alert--warning {
  background: var(--warning-light) !important;
}
.el-alert--error {
  background: var(--danger-light) !important;
}

/* Divider */
.el-divider {
  border-color: var(--border-light) !important;
}
.el-divider__text {
  background: transparent !important;
  color: var(--text-muted) !important;
  font-weight: 600;
  font-size: var(--text-xs);
  letter-spacing: 0.05em;
}

/* InputNumber */
.el-input-number {
  --el-input-bg-color: var(--bg-input) !important;
}

/* Message / Notification */
.el-message {
  border-radius: var(--radius-lg) !important;
  background: var(--bg-float) !important;
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--border-glass) !important;
  box-shadow: var(--shadow-xl) !important;
}

/* Table */
.el-table {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-header-bg-color: var(--bg-glass) !important;
  --el-table-row-hover-bg-color: var(--gradient-primary-subtle) !important;
  --el-table-border-color: var(--border-light) !important;
}
.el-table th.el-table__cell {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* Tabs */
.el-tabs__header {
  border-bottom-color: var(--border-light) !important;
}
.el-tabs__item {
  color: var(--text-secondary) !important;
  font-weight: 500;
  transition: all var(--transition-fast);
}
.el-tabs__item.is-active {
  color: var(--primary) !important;
  font-weight: 700;
}
.el-tabs__active-bar {
  background: var(--gradient-primary) !important;
  height: 3px !important;
  border-radius: var(--radius-full) !important;
}

/* Pagination */
.el-pagination .el-pager li {
  border-radius: var(--radius-sm) !important;
  font-weight: 500;
}
.el-pagination .el-pager li.is-active {
  background: var(--gradient-primary) !important;
  color: white !important;
}

/* Menu */
.el-menu {
  border-right: none !important;
  background: transparent !important;
}
.el-menu-item {
  border-radius: var(--radius-sm) !important;
  margin: 2px 8px !important;
  transition: all var(--transition-fast);
}
.el-menu-item:hover {
  background: var(--gradient-primary-subtle) !important;
}
.el-menu-item.is-active {
  background: var(--gradient-primary-subtle) !important;
  color: var(--primary) !important;
  font-weight: 600;
}

/* Progress */
.el-progress-bar__outer {
  background: #e2e8f0 !important;
  border-radius: var(--radius-full) !important;
}
.el-progress-bar__inner {
  border-radius: var(--radius-full) !important;
  background: var(--gradient-primary) !important;
}

/* Drawer */
.el-drawer {
  background: var(--bg-secondary) !important;
  backdrop-filter: blur(var(--blur-xl));
  border-left: 1px solid var(--border-glass) !important;
}

/* ===== Pro Max Utility Classes ===== */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
}

.glass-strong {
  background: var(--bg-glass-strong);
  backdrop-filter: blur(var(--blur-xl));
  -webkit-backdrop-filter: blur(var(--blur-xl));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gradient-border {
  position: relative;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: var(--gradient-primary);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.card-hover-lift {
  transition: all var(--transition-spring);
}
.card-hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

/* ===== Focus Visibility ===== */
*:focus-visible {
  outline: 2.5px solid var(--primary-400);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ===== Text Selection ===== */
::selection {
  background: linear-gradient(135deg, rgba(244,63,94,0.25), rgba(56,189,248,0.25));
  color: var(--text-primary);
}

/* ===== Skeleton animation ===== */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  :root {
    --radius-sm: 8px;
    --radius-md: 10px;
    --radius-lg: 14px;
    --radius-xl: 18px;
    --space-lg: 16px;
    --space-xl: 24px;
    --space-2xl: 32px;
  }

  body { font-size: 14px; }

  .el-dialog {
    width: 95% !important;
    margin: 16px auto !important;
    border-radius: var(--radius-lg) !important;
  }
  .el-dialog__header { padding: 18px 20px !important; }
  .el-dialog__body { padding: 20px !important; max-height: 60vh; overflow-y: auto; }
  .el-dialog__footer { padding: 14px 20px !important; }
}

@media (max-width: 480px) {
  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100vh;
  }
  .el-dialog__body { max-height: calc(100vh - 120px); }
}

/* ===== Dialog z-index overrides ===== */
.el-overlay.relationship-modal { z-index: 9998 !important; }
.el-dialog.relationship-graph-dialog { z-index: 9999 !important; }
.el-dialog__wrapper .el-overlay-dialog { z-index: 9998 !important; }
</style>

