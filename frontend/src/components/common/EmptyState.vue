<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="imageSize">
      <template #image v-if="customImage">
        <img :src="customImage" alt="empty" />
      </template>
      <slot name="action">
        <el-button v-if="actionText" :type="actionType" @click="handleAction">
          {{ actionText }}
        </el-button>
      </slot>
    </el-empty>
  </div>
</template>

<script setup>
defineProps({
  description: {
    type: String,
    default: '暂无数据'
  },
  imageSize: {
    type: Number,
    default: 100
  },
  customImage: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionType: {
    type: String,
    default: 'primary'
  }
});

const emit = defineEmits(['action']);

const handleAction = () => {
  emit('action');
};
</script>

<style scoped>
.empty-state {
  padding: 40px 20px;
}
</style>
