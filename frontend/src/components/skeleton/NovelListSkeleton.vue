<template>
  <div class="novel-list-skeleton">
    <!-- 头部骨架 -->
    <div class="skeleton-header">
      <el-skeleton-item variant="text" class="header-title" />
      <el-skeleton-item variant="button" class="create-btn" />
    </div>
    
    <!-- 网格骨架 -->
    <div class="skeleton-grid" :class="`grid-${columns}`">
      <div 
        v-for="i in itemCount" 
        :key="i" 
        class="novel-card-skeleton"
      >
        <div class="card-cover-skeleton">
          <el-skeleton-item variant="image" class="cover-image" />
          <div class="cover-overlay">
            <el-skeleton-item variant="circle" class="play-icon" />
          </div>
        </div>
        
        <div class="card-content-skeleton">
          <el-skeleton-item variant="text" class="card-title" />
          <el-skeleton-item variant="text" class="card-desc" />
          
          <div class="card-meta-skeleton">
            <el-skeleton-item variant="text" class="meta-item" />
            <el-skeleton-item variant="text" class="meta-item" />
          </div>
          
          <div class="card-footer-skeleton">
            <el-skeleton-item variant="text" class="date" />
            <el-skeleton-item variant="circle" class="menu-dot" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  itemCount: { type: Number, default: 8 },
  columns: { type: Number, default: 4 }
})

const columns = computed(() => {
  const width = window.innerWidth
  if (width >= 1200) return 4
  if (width >= 768) return 3
  if (width >= 480) return 2
  return 1
})
</script>

<style scoped>
.novel-list-skeleton {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 头部骨架 */
.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-title {
  width: 150px;
  height: 28px;
}

.create-btn {
  width: 120px;
  height: 40px;
  border-radius: 8px;
}

/* 网格布局 */
.skeleton-grid {
  display: grid;
  gap: 24px;
}

.skeleton-grid.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.skeleton-grid.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.skeleton-grid.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.skeleton-grid.grid-1 {
  grid-template-columns: 1fr;
}

/* 卡片骨架 */
.novel-card-skeleton {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: transform 0.3s;
}

.novel-card-skeleton:hover {
  transform: translateY(-4px);
}

.card-cover-skeleton {
  position: relative;
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(251, 113, 133, 0.1) 100%);
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.3s;
}

.novel-card-skeleton:hover .cover-overlay {
  opacity: 1;
}

.play-icon {
  width: 48px;
  height: 48px;
}

.card-content-skeleton {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-title {
  width: 80%;
  height: 20px;
}

.card-desc {
  width: 100%;
  height: 14px;
}

.card-meta-skeleton {
  display: flex;
  gap: 16px;
}

.meta-item {
  width: 60px;
  height: 14px;
}

.card-footer-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.date {
  width: 80px;
  height: 12px;
}

.menu-dot {
  width: 24px;
  height: 24px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .skeleton-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 768px) {
  .novel-list-skeleton {
    padding: 16px;
  }
  
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 16px;
  }
  
  .header-title {
    width: 120px;
    height: 24px;
  }
  
  .create-btn {
    width: 100px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .skeleton-grid {
    grid-template-columns: 1fr !important;
  }
  
  .card-cover-skeleton {
    aspect-ratio: 16/9;
  }
}
</style>
