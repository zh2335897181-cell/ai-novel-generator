<template>
  <div class="bookshelf-page">
    <div class="header">
      <div class="header-content">
        <div class="logo-section" @click="$router.push('/')" style="cursor: pointer;">
          <div class="logo-icon">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <div class="logo-text">
            <h1>一点纸墨</h1>
            <p class="logo-subtitle">公共书架</p>
          </div>
        </div>
        <div class="header-actions">
          <el-select v-model="categoryFilter" placeholder="全部分类" clearable @change="loadNovels" style="width: 140px">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
          <el-button @click="goCreate" type="primary">去创作</el-button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <el-empty v-if="novels.length === 0" description="书架还没有作品，快去创作吧" />

      <div v-else class="novel-grid">
        <div v-for="novel in novels" :key="novel.id" class="novel-card" @click="$router.push(`/read/${novel.id}`)">
          <div class="card-header">
            <div class="card-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
          </div>
          <h3>{{ novel.title }}</h3>
          <el-tag v-if="novel.category" size="small" type="info" class="category-tag">{{ novel.category }}</el-tag>
          <p class="author-name">作者：{{ novel.author_name }}</p>
          <div class="card-footer">
            <span class="date">{{ new Date(novel.published_at).toLocaleDateString('zh-CN') }}</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="total > pageSize"
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="loadNovels"
        layout="total, prev, pager, next"
        class="pagination"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Reading, Document, ArrowRight } from '@element-plus/icons-vue'
import api from '../api/novel'

const router = useRouter()

const novels = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const categoryFilter = ref('')

const categories = [
  '玄幻', '奇幻', '武侠', '仙侠', '都市', '现实',
  '军事', '历史', '游戏', '体育', '科幻', '悬疑',
  '轻小说', '言情', '谴责', '侦探', '科学幻想',
  '推理', '惊险', '纪实', '动漫', '乡土', '耽美'
]

const loadNovels = async () => {
  try {
    const res = await api.getPublicNovels({
      page: page.value,
      pageSize: pageSize.value,
      category: categoryFilter.value || undefined
    })
    novels.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('加载书架失败', e)
  }
}

loadNovels()

const goCreate = () => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('guestMode') === 'true'
  if (token || isGuest) {
    router.push('/novels')
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.bookshelf-page {
  min-height: 100vh;
  background: var(--gradient-bg);
  position: relative;
}

/* Ambient orbs */
.bookshelf-page::before {
  content: '';
  position: fixed;
  top: -20%; right: -10%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(56,189,248,0.15), transparent 60%),
              radial-gradient(circle at 80% 30%, rgba(244,63,94,0.1), transparent 55%);
  border-radius: 50%;
  pointer-events: none;
}
.bookshelf-page::after {
  content: '';
  position: fixed;
  bottom: -20%; left: -5%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(168,85,247,0.1), transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}

/* Header */
.header {
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-xl)) saturate(2);
  -webkit-backdrop-filter: blur(var(--blur-xl)) saturate(2);
  border-bottom: 1px solid var(--border-glass);
  box-shadow: var(--shadow-card);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px 40px;
}
.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo-section { display: flex; align-items: center; gap: 16px; }
.logo-icon {
  width: 46px; height: 46px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  box-shadow: 0 6px 16px var(--primary-glow);
  transition: all var(--transition-spring);
}
.logo-section:hover .logo-icon { transform: scale(1.08) rotate(-4deg); }
.logo-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.03em;
}
.logo-subtitle { margin: 2px 0 0; font-size: 12px; color: var(--text-muted); font-weight: 500; }
.header-actions { display: flex; gap: 12px; align-items: center; }

/* Main */
.main-content { max-width: 1200px; margin: 0 auto; padding: 40px; }
.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
}

/* Premium glass cards */
.novel-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-glass);
  padding: 24px;
  cursor: pointer;
  transition: all var(--transition-spring);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  animation: cardReveal 0.5s var(--ease-out-expo) backwards;
}
.novel-card:nth-child(1) { animation-delay: 0.05s; }
.novel-card:nth-child(2) { animation-delay: 0.1s; }
.novel-card:nth-child(3) { animation-delay: 0.15s; }
.novel-card:nth-child(4) { animation-delay: 0.2s; }
.novel-card:nth-child(5) { animation-delay: 0.25s; }
.novel-card:nth-child(6) { animation-delay: 0.3s; }

@keyframes cardReveal {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Card gradient top accent */
.novel-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s var(--ease-out-expo);
  z-index: 1;
}
.novel-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(244,63,94,0.03), transparent 55%),
              radial-gradient(circle at 70% 80%, rgba(56,189,248,0.03), transparent 55%);
  opacity: 0;
  transition: opacity 0.4s var(--ease-out);
  pointer-events: none;
}
.novel-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-accent);
}
.novel-card:hover::before { transform: scaleX(1); }
.novel-card:hover::after { opacity: 1; }

.card-icon {
  width: 48px; height: 48px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary-subtle);
  display: flex; align-items: center; justify-content: center;
  color: var(--primary);
  margin-bottom: 14px;
  transition: all var(--transition-spring);
}
.novel-card:hover .card-icon { transform: scale(1.08) rotate(-3deg); color: var(--primary-dark); }
.novel-card h3 {
  margin: 0 0 6px;
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-weight: 700;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.author-name { margin: 6px 0; font-size: var(--text-sm); color: var(--text-muted); }
.category-tag { margin-bottom: 8px; }
.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 14px; color: var(--text-muted); font-size: var(--text-xs);
  font-weight: 500;
}
.novel-card:hover .card-footer .el-icon { transform: translateX(4px); color: var(--primary); }
.card-footer .el-icon { transition: all var(--transition-spring); }

.pagination { margin-top: 32px; display: flex; justify-content: center; }

/* Empty */
:deep(.el-empty__description) { color: var(--text-muted) !important; }

@media (max-width: 768px) {
  .header { padding: 12px 20px; }
  .main-content { padding: 20px; }
  .novel-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
  .novel-card { padding: 18px; }
  .logo-text h1 { font-size: 18px; }
}
</style>
