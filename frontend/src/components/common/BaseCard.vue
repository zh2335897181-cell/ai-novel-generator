<template>
  <el-card :class="['base-card', { 'is-hoverable': hoverable }]" :shadow="shadow">
    <template #header v-if="title || $slots.header">
      <slot name="header">
        <div class="card-header">
          <span class="card-title">{{ title }}</span>
          <slot name="extra" />
        </div>
      </slot>
    </template>
    <slot />
  </el-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  shadow: {
    type: String,
    default: 'hover',
    validator: (value) => ['always', 'hover', 'never'].includes(value)
  }
});
</script>

<style scoped>
.base-card {
  transition: all 0.3s;
}

.base-card.is-hoverable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
</style>
