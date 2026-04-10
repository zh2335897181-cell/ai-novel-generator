<template>
  <div class="novel-skeleton" :class="{ 'immersive': immersive }">
    <!-- 侧边栏骨架 -->
    <div class="skeleton-sidebar" v-if="!hideSidebar">
      <!-- Logo -->
      <div class="skeleton-logo">
        <el-skeleton-item variant="circle" class="logo-icon" />
        <el-skeleton-item variant="text" class="logo-text" />
      </div>
      
      <!-- 面包屑 -->
      <div class="skeleton-breadcrumb">
        <el-skeleton-item variant="text" class="breadcrumb-item" />
      </div>
      
      <!-- 小说标题 -->
      <el-skeleton-item variant="h3" class="novel-title-skeleton" />
      
      <!-- 菜单项 -->
      <div class="skeleton-menu">
        <div v-for="i in 5" :key="i" class="skeleton-menu-item">
          <el-skeleton-item variant="text" class="menu-title" />
          <div class="sub-items">
            <el-skeleton-item 
              v-for="j in 3" 
              :key="j" 
              variant="text" 
              class="sub-item" 
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 主内容区骨架 -->
    <div class="skeleton-main">
      <!-- 生成区骨架 -->
      <div class="skeleton-generator">
        <el-skeleton-item variant="text" class="section-title" />
        <el-skeleton :rows="3" animated />
        <div class="skeleton-actions">
          <el-skeleton-item variant="button" class="action-btn" />
          <el-skeleton-item variant="button" class="action-btn" />
        </div>
      </div>
      
      <!-- 内容区骨架 -->
      <div class="skeleton-content">
        <el-skeleton-item variant="text" class="content-title" />
        
        <div v-for="i in contentCount" :key="i" class="content-card-skeleton">
          <div class="card-header-skeleton">
            <el-skeleton-item variant="text" class="card-badge" />
            <el-skeleton-item variant="text" class="card-title" />
          </div>
          <el-skeleton :rows="4" animated />
          <div class="card-footer-skeleton">
            <el-skeleton-item variant="text" class="card-meta" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧信息区（桌面端） -->
    <div class="skeleton-aside-right" v-if="showRightAside">
      <div v-for="i in 2" :key="i" class="info-card-skeleton">
        <el-skeleton-item variant="text" class="card-header" />
        <el-skeleton :rows="4" animated />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  hideSidebar: { type: Boolean, default: false },
  showRightAside: { type: Boolean, default: false },
  immersive: { type: Boolean, default: false },
  contentCount: { type: Number, default: 3 }
})
</script>

<style scoped>
.novel-skeleton {
  display: flex;
  min-height: 100vh;
  background: var(--gradient-bg);
}

/* 侧边栏骨架 */
.skeleton-sidebar {
  width: 320px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.skeleton-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-icon {
  width: 44px;
  height: 44px;
}

.logo-text {
  width: 120px;
  height: 20px;
}

.skeleton-breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-item {
  width: 80%;
  height: 16px;
}

.novel-title-skeleton {
  width: 100%;
  height: 28px;
  margin-bottom: 20px;
}

.skeleton-menu {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-menu-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-title {
  width: 60%;
  height: 18px;
}

.sub-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
}

.sub-item {
  width: 80%;
  height: 14px;
}

/* 主内容区骨架 */
.skeleton-main {
  flex: 1;
  padding: 24px 32px;
  max-width: 1000px;
}

.skeleton-generator {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.section-title {
  width: 120px;
  height: 20px;
  margin-bottom: 16px;
}

.skeleton-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  width: 100px;
  height: 40px;
  border-radius: 8px;
}

/* 内容区骨架 */
.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-title {
  width: 80px;
  height: 24px;
}

.content-card-skeleton {
  padding: 24px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.9);
}

.card-header-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(30, 64, 175, 0.2);
}

.card-badge {
  width: 60px;
  height: 24px;
  border-radius: 12px;
}

.card-title {
  flex: 1;
  height: 20px;
}

.card-footer-skeleton {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(30, 64, 175, 0.1);
}

.card-meta {
  width: 120px;
  height: 16px;
}

/* 右侧边栏骨架 */
.skeleton-aside-right {
  width: 300px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card-skeleton {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
}

.info-card-skeleton .card-header {
  width: 60%;
  height: 18px;
  margin-bottom: 12px;
}

/* 沉浸式模式 */
.novel-skeleton.immersive {
  background: var(--bg-primary);
}

.novel-skeleton.immersive .skeleton-sidebar,
.novel-skeleton.immersive .skeleton-aside-right {
  display: none;
}

.novel-skeleton.immersive .skeleton-main {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 60px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .skeleton-sidebar {
    display: none;
  }
  
  .skeleton-main {
    padding: 16px;
  }
  
  .skeleton-generator {
    padding: 16px;
  }
  
  .content-card-skeleton {
    padding: 16px;
  }
  
  .skeleton-aside-right {
    display: none;
  }
}
</style>
