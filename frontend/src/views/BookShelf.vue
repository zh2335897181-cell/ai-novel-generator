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
  background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
}

.header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #e4e7ed;
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
.logo-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #fb7185, #38bdf8); display: flex; align-items: center; justify-content: center; color: #fff; }
.logo-text h1 { margin: 0; font-size: 24px; font-weight: 700; }
.logo-subtitle { margin: 4px 0 0; font-size: 13px; color: #909399; }
.header-actions { display: flex; gap: 12px; align-items: center; }

.main-content { max-width: 1200px; margin: 0 auto; padding: 40px; }

.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.novel-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.novel-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); }
.card-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f093fb20, #f5576c20); display: flex; align-items: center; justify-content: center; color: #f5576c; margin-bottom: 12px; }
.novel-card h3 { margin: 0 0 8px; font-size: 18px; color: #303133; }
.author-name { margin: 8px 0; font-size: 13px; color: #909399; }
.category-tag { margin-bottom: 8px; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; color: #909399; font-size: 12px; }

.pagination { margin-top: 32px; display: flex; justify-content: center; }

@media (max-width: 768px) {
  .header { padding: 12px 20px; }
  .main-content { padding: 20px; }
  .novel-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
}
</style>
