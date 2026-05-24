<template>
  <div class="empty-state">
    <div class="empty-icon" v-if="!customImage">
      <slot name="icon">
        <svg class="empty-graphic" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2" stroke-dasharray="8 4" opacity="0.3"/>
          <path d="M40 55c0-8.8 9-16 20-16s20 7.2 20 16c0 7.2-5.6 13.2-13 15.3V75H53v-4.7C45.6 68.2 40 62.2 40 55z" fill="currentColor" opacity="0.15"/>
          <circle cx="75" cy="48" r="3" fill="currentColor" opacity="0.3"/>
          <circle cx="85" cy="52" r="2" fill="currentColor" opacity="0.2"/>
        </svg>
      </slot>
    </div>
    <img v-else :src="customImage" alt="empty" class="empty-image" />
    <p class="empty-description">{{ description }}</p>
    <slot name="action">
      <el-button v-if="actionText" :type="actionType" @click="handleAction" class="empty-action">
        {{ actionText }}
      </el-button>
    </slot>
  </div>
</template>

<script setup>
defineProps({
  description: { type: String, default: '暂无数据' },
  imageSize: { type: Number, default: 100 },
  customImage: { type: String, default: '' },
  actionText: { type: String, default: '' },
  actionType: { type: String, default: 'primary' }
});

const emit = defineEmits(['action']);
const handleAction = () => { emit('action'); };
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  color: var(--text-muted);
}

.empty-graphic {
  width: 100%;
  height: 100%;
}

.empty-image {
  max-width: 160px;
  margin-bottom: 24px;
  opacity: 0.6;
}

.empty-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 20px 0;
  max-width: 280px;
  line-height: 1.6;
}

.empty-action {
  margin-top: 4px;
}
</style>
