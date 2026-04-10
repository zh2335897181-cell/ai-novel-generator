<template>
  <div class="loading-state">
    <el-skeleton v-if="type === 'skeleton'" :rows="rows" animated />
    <div v-else-if="type === 'spinner'" class="spinner-container">
      <el-icon class="is-loading" :size="size">
        <Loading />
      </el-icon>
      <p v-if="text" class="loading-text">{{ text }}</p>
    </div>
    <div v-else class="custom-loading">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue';

defineProps({
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['skeleton', 'spinner', 'custom'].includes(value)
  },
  rows: {
    type: Number,
    default: 3
  },
  size: {
    type: Number,
    default: 40
  },
  text: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.loading-state {
  padding: 20px;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.loading-text {
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}
</style>

