<template>
  <div v-if="visible" :class="['announcement-bar', `announcement-${type}`]">
    <div class="announcement-content">
      <el-icon class="announcement-icon" :size="16">
        <WarningFilled v-if="type === 'danger'" />
        <InfoFilled v-else />
      </el-icon>
      <span class="announcement-text">{{ content }}</span>
    </div>
    <el-button text class="announcement-close" @click="dismiss">
      <el-icon :size="14"><Close /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { InfoFilled, WarningFilled, Close } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'

const content = ref('')
const type = ref('info')
const visible = ref(false)
const dismissed = ref(false)

const route = useRoute()

const fetchAnnouncement = async () => {
  try {
    const res = await fetch('/api/announcement')
    const data = await res.json()
    if (!data.success || !data.data) return

    const ann = data.data
    if (!ann.enabled || !ann.content) {
      visible.value = false
      return
    }

    // 内容或类型变化时重新显示
    const changed = content.value !== ann.content || type.value !== ann.type
    content.value = ann.content
    type.value = ann.type || 'info'

    if (changed) {
      dismissed.value = false
    }

    if (!dismissed.value) {
      visible.value = true
    }
  } catch (_) {}
}

onMounted(fetchAnnouncement)

// 路由切换时重新获取公告（确保跨页面显示）
watch(() => route.path, fetchAnnouncement)

const dismiss = () => {
  visible.value = false
  dismissed.value = true
}
</script>

<style scoped>
.announcement-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  gap: 12px;
  font-size: 14px;
  position: relative;
  z-index: 1001;
  animation: announcementSlideDown 0.3s ease-out;
}

@keyframes announcementSlideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

.announcement-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  max-width: 960px;
}

.announcement-icon {
  flex-shrink: 0;
}

.announcement-text {
  white-space: pre-wrap;
  line-height: 1.6;
  text-align: center;
}

.announcement-close {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
}
.announcement-close:hover {
  opacity: 1;
}

/* 信息 - 蓝色 */
.announcement-info {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-bottom: 1px solid #bfdbfe;
  color: #1e40af;
}
.announcement-info .announcement-icon {
  color: #3b82f6;
}

/* 警告 - 橙色 */
.announcement-warning {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-bottom: 1px solid #fde68a;
  color: #92400e;
}
.announcement-warning .announcement-icon {
  color: #f59e0b;
}

/* 重要 - 红色 */
.announcement-danger {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border-bottom: 1px solid #fecaca;
  color: #991b1b;
}
.announcement-danger .announcement-icon {
  color: #ef4444;
}

/* 暗色模式 */
:global(.dark) .announcement-info {
  background: linear-gradient(135deg, #1e3a5f, #1a2942);
  border-bottom-color: #2d4a6f;
  color: #93c5fd;
}
:global(.dark) .announcement-warning {
  background: linear-gradient(135deg, #3d2e0a, #2d2410);
  border-bottom-color: #5c4a1f;
  color: #fcd34d;
}
:global(.dark) .announcement-danger {
  background: linear-gradient(135deg, #3d1515, #2d1010);
  border-bottom-color: #5c2020;
  color: #fca5a5;
}

@media (max-width: 768px) {
  .announcement-bar {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
