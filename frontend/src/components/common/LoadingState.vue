<template>
  <div class="loading-state">
    <template v-if="type === 'skeleton'">
      <div v-for="i in rows" :key="i" class="skeleton-row" :style="{ width: skeletonWidth(i) }">
        <div class="skeleton-bar" />
      </div>
    </template>
    <div v-else-if="type === 'spinner'" class="spinner-container">
      <div class="spinner-ring">
        <div class="ring-inner" />
      </div>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
    <div v-else class="custom-loading">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'spinner', validator: (v) => ['skeleton', 'spinner', 'custom'].includes(v) },
  rows: { type: Number, default: 3 },
  size: { type: Number, default: 40 },
  text: { type: String, default: '' }
});

const skeletonWidth = (i) => {
  const widths = ['100%', '85%', '92%', '70%', '88%', '75%'];
  return widths[(i - 1) % widths.length];
};
</script>

<style scoped>
.loading-state {
  padding: 24px;
}

/* Premium Spinner */
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.spinner-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--gradient-primary);
  animation: ring-pulse 1.2s var(--ease-in-out) infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring .ring-inner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: white;
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.85); opacity: 0.6; }
}

.loading-text {
  margin-top: 20px;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* Premium Skeleton */
.skeleton-row {
  margin-bottom: 14px;
}

.skeleton-bar {
  height: 14px;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-row:first-child .skeleton-bar { height: 20px; }

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
