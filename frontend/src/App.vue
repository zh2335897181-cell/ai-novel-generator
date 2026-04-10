<template>
  <div id="app">
    <router-view />
    <CookieConsent />
    <FeedbackDialog />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useUserStore } from './stores/user'
import CookieConsent from './components/CookieConsent.vue'
import FeedbackDialog from './components/FeedbackDialog.vue'

const userStore = useUserStore()

// 键盘快捷键监听
const handleKeyDown = (e) => {
  // Ctrl+Shift+U 解锁快捷键
  if (e.ctrlKey && e.shiftKey && e.key === 'U') {
    e.preventDefault()
    userStore.unlockWithShortcut()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 恢复登录状态
  userStore.fetchUserInfo()
  
  // 恢复游客模式状态
  const guestMode = localStorage.getItem('guestMode')
  if (guestMode === 'true') {
    userStore.setGuestMode(true)
  }
  
  // 检查解锁状态
  userStore.checkUnlockStatus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

/* ===== Design System - Kawaii Anime Dark Theme ===== */
:root {
  /* Primary palette - Soft pastel kawaii */
  --primary: #fb7185;          /* soft sakura pink */
  --primary-light: #fecdd3;
  --primary-dark: #e11d48;
  --primary-glow: rgba(248, 113, 113, 0.45);
  --accent: #38bdf8;           /* sky blue */
  --accent-light: #bae6fd;
  --accent-glow: rgba(56, 189, 248, 0.4);

  /* Gradients (avoid单一紫色，采用多彩糖果色) */
  --gradient-primary: linear-gradient(135deg, #fb7185 0%, #38bdf8 40%, #a855f7 80%);
  --gradient-accent: linear-gradient(135deg, #4ade80 0%, #38bdf8 40%, #fb7185 100%);
  --gradient-warm: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
  --gradient-success: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  /* 背景改为更明亮的二次元糖果云朵色 */
  --gradient-bg: radial-gradient(circle at 0% 0%, #e0f2fe 0%, #fdf2ff 35%, #fefce8 70%, #f9fafb 100%);

  /* Backgrounds */
  --bg-deep: #f3f4ff;
  --bg-primary: rgba(255, 255, 255, 0.85);
  --bg-secondary: rgba(255, 255, 255, 0.9);
  --bg-elevated: rgba(255, 255, 255, 0.96);
  --bg-card: rgba(255, 255, 255, 0.9);
  --bg-card-hover: rgba(255, 255, 255, 1);
  --bg-glass: rgba(255, 255, 255, 0.75);
  --bg-glass-strong: rgba(255, 255, 255, 0.9);
  --bg-input: rgba(248, 250, 252, 0.9);

  /* Text */
  --text-primary: #1f2933;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --text-accent: #fb7185;

  /* Status */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;

  /* Borders */
  --border: rgba(255, 255, 255, 0.08);
  --border-light: rgba(255, 255, 255, 0.12);
  --border-accent: rgba(124, 58, 237, 0.3);

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 50px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 30px var(--primary-glow);
  --shadow-accent-glow: 0 0 30px var(--accent-glow);

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-fast: 150ms var(--ease-out);
  --transition-base: 300ms var(--ease-out);
  --transition-slow: 500ms var(--ease-out);

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}

/* ===== Global Reset ===== */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  overflow-x: hidden;
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* ===== App Container ===== */
#app {
  font-family: 'Noto Sans SC', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  min-height: 100vh;
  background: var(--gradient-bg);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.6;
}

/* ===== Page Transitions ===== */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all var(--transition-base);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* ===== Element Plus Dark Overrides ===== */
.el-button {
  border-radius: var(--radius-sm) !important;
  font-weight: 500;
  font-family: inherit;
  transition: all var(--transition-fast);
  border: 1px solid var(--border) !important;
  background: var(--bg-glass) !important;
  color: var(--text-primary) !important;
}
.el-button:hover {
  background: var(--bg-glass-strong) !important;
  border-color: var(--border-light) !important;
  transform: translateY(-1px);
}
.el-button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  color: white !important;
}
.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow);
}
.el-button--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  border: none !important;
  color: white !important;
}
.el-button--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  border: none !important;
  color: white !important;
}
.el-button--success {
  background: var(--gradient-success) !important;
  border: none !important;
  color: white !important;
}

/* Dialog */
.el-dialog {
  border-radius: var(--radius-xl) !important;
  background: var(--bg-secondary) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-xl) !important;
  overflow: hidden;
}
.el-dialog__header {
  background: var(--bg-elevated) !important;
  padding: 20px 24px !important;
  border-bottom: 1px solid var(--border) !important;
}
.el-dialog__title {
  color: var(--text-primary) !important;
  font-weight: 600 !important;
}
.el-dialog__headerbtn .el-dialog__close {
  color: var(--text-secondary) !important;
}
.el-dialog__body {
  padding: 24px !important;
  color: var(--text-primary) !important;
}
.el-dialog__footer {
  padding: 16px 24px !important;
  border-top: 1px solid var(--border) !important;
  background: var(--bg-elevated) !important;
}

/* Form */
.el-form-item__label {
  color: var(--text-secondary) !important;
  font-weight: 500;
}

/* Input */
.el-input__wrapper,
.el-textarea__inner {
  background: var(--bg-input) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
  color: var(--text-primary) !important;
  border-radius: var(--radius-sm) !important;
}
.el-input__wrapper:hover,
.el-textarea__inner:hover {
  border-color: var(--border-light) !important;
}
.el-input__wrapper.is-focus,
.el-textarea__inner:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15) !important;
}
.el-input__inner {
  color: var(--text-primary) !important;
}
.el-input__inner::placeholder,
.el-textarea__inner::placeholder {
  color: var(--text-muted) !important;
}

/* Select */
.el-select__wrapper {
  background: var(--bg-input) !important;
  border: 1px solid var(--border) !important;
  box-shadow: none !important;
}
.el-select-dropdown {
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
}
.el-select-dropdown__item {
  color: var(--text-primary) !important;
}
.el-select-dropdown__item.is-hovering {
  background: var(--bg-glass-strong) !important;
}

/* Card */
.el-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-lg) !important;
  color: var(--text-primary) !important;
}
.el-card__header {
  border-bottom: 1px solid var(--border) !important;
  color: var(--text-primary) !important;
  padding: 14px 20px !important;
}
.el-card__body {
  color: var(--text-primary) !important;
}

/* Tag */
.el-tag {
  border-radius: var(--radius-full) !important;
  border: none !important;
}
.el-tag--success {
  background: rgba(16, 185, 129, 0.15) !important;
  color: #34d399 !important;
}
.el-tag--warning {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #fbbf24 !important;
}
.el-tag--danger {
  background: rgba(239, 68, 68, 0.15) !important;
  color: #f87171 !important;
}
.el-tag--info {
  background: rgba(148, 163, 184, 0.15) !important;
  color: #94a3b8 !important;
}
.el-tag--primary {
  background: rgba(124, 58, 237, 0.15) !important;
  color: #a78bfa !important;
}

/* Slider */
.el-slider__runway {
  background: var(--bg-glass-strong) !important;
}
.el-slider__bar {
  background: var(--gradient-primary) !important;
}
.el-slider__button {
  border-color: var(--primary) !important;
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
  border-bottom: 1px solid var(--border) !important;
  color: var(--text-primary) !important;
}
.el-collapse-item__wrap {
  background: transparent !important;
  border-bottom: 1px solid var(--border) !important;
}

/* Badge */
.el-badge__content {
  border: none !important;
}

/* Alert */
.el-alert {
  border-radius: var(--radius-md) !important;
}
.el-alert--info {
  background: rgba(59, 130, 246, 0.1) !important;
  border: 1px solid rgba(59, 130, 246, 0.2) !important;
}
.el-alert--info .el-alert__title {
  color: #60a5fa !important;
}
.el-alert--info .el-alert__description {
  color: var(--text-secondary) !important;
}

/* Divider */
.el-divider {
  border-color: var(--border) !important;
}
.el-divider__text {
  background: var(--bg-secondary) !important;
  color: var(--text-muted) !important;
}

/* InputNumber */
.el-input-number {
  --el-input-bg-color: var(--bg-input) !important;
}

/* Message */
.el-message {
  border-radius: var(--radius-md) !important;
  background: var(--bg-elevated) !important;
  border: 1px solid var(--border) !important;
  box-shadow: var(--shadow-lg) !important;
}

/* ===== Utility Classes ===== */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
}

.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Focus Visibility ===== */
*:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* ===== Text Selection ===== */
::selection {
  background: rgba(124, 58, 237, 0.4);
  color: white;
}

/* ===== Responsive ===== */
@media (max-width: 768px) {
  :root {
    --space-lg: 16px;
    --space-xl: 24px;
    --space-2xl: 32px;
  }
  
  /* 移动端字体调整 */
  body {
    font-size: 14px;
  }
  
  /* 移动端对话框全屏 */
  .el-dialog {
    width: 95% !important;
    margin: 20px auto !important;
  }
  
  .el-dialog__body {
    max-height: 60vh;
    overflow-y: auto;
  }
}

@media (max-width: 480px) {
  /* 小屏幕对话框完全全屏 */
  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100vh;
  }
  
  .el-dialog__body {
    max-height: calc(100vh - 120px);
  }
}

/* ===== Dialog z-index override for relationship graph ===== */
.el-overlay.relationship-modal {
  z-index: 9998 !important;
}

.el-dialog.relationship-graph-dialog {
  z-index: 9999 !important;
}

.el-dialog__wrapper .el-overlay-dialog {
  z-index: 9998 !important;
}
</style>

