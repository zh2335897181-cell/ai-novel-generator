<template>
  <div class="public-read-page">
    <div class="header">
      <div class="header-content">
        <el-button text @click="$router.push('/bookshelf')">
          <el-icon><ArrowLeft /></el-icon>返回书架
        </el-button>
        <h2>{{ novel?.title || '加载中...' }}</h2>
        <el-button @click="shareLink" type="primary" size="small">
          <el-icon><Link /></el-icon>分享
        </el-button>
      </div>
    </div>

    <div class="main-content" v-if="novel">
      <div class="novel-info">
        <el-tag v-if="novel.category" size="small">{{ novel.category }}</el-tag>
        <span class="author">作者：{{ novel.author_name }}</span>
        <span class="pub-date">发布：{{ new Date(novel.published_at).toLocaleDateString('zh-CN') }}</span>
      </div>

      <el-divider />

      <h3>章节列表（{{ chapters?.length || 0 }} 章）</h3>
      <div class="chapter-section">
        <div class="chapter-list">
          <div
            v-for="chapter in chapters"
            :key="chapter.id"
            :class="['chapter-item', { active: activeChapter?.id === chapter.id }]"
            @click="activeChapter = chapter"
          >
            <span class="ch-num">第{{ chapter.chapter_number }}章</span>
            <span class="ch-title">{{ chapter.chapter_title || '未命名' }}</span>
            <span class="ch-words">{{ chapter.word_count }} 字</span>
          </div>
        </div>

        <div class="chapter-content" v-if="activeChapter">
          <h4>{{ activeChapter.chapter_title || `第${activeChapter.chapter_number}章` }}</h4>
          <div class="content-text">{{ activeChapterFullContent }}</div>
        </div>
        <el-empty v-else description="点击左侧章节开始阅读" />
      </div>

      <div class="chapter-nav" v-if="activeChapter">
        <el-button :disabled="!hasPrev" @click="goToChapter(currentIndex - 1)">
          <el-icon><ArrowUp /></el-icon>上一章
        </el-button>
        <span class="nav-info">第{{ activeChapter.chapter_number }}章 / 共{{ chapters.length }}章</span>
        <el-button :disabled="!hasNext" @click="goToChapter(currentIndex + 1)">
          下一章<el-icon><ArrowDown /></el-icon>
        </el-button>
      </div>

      <div class="cta-section">
        <el-divider />
        <p>想创作自己的小说？</p>
        <el-button type="primary" size="large" @click="goCreate">开始创作</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Link, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../api/novel'

const route = useRoute()
const router = useRouter()
const novel = ref(null)
const chapters = ref([])
const activeChapter = ref(null)
const activeChapterFullContent = ref('')

const currentIndex = computed(() => chapters.value.findIndex(c => c.id === activeChapter.value?.id))
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < chapters.value.length - 1)

onMounted(async () => {
  try {
    const res = await api.getPublicNovelDetail(route.params.novelId)
    novel.value = res.data.novel
    chapters.value = res.data.chapters
    if (chapters.value.length > 0) {
      activeChapter.value = chapters.value[0]
      loadChapterContent(chapters.value[0].id)
    }
  } catch (e) {
    ElMessage.error('加载失败：' + e.message)
  }
})

watch(activeChapter, (chapter) => {
  if (chapter) loadChapterContent(chapter.id)
})

const loadChapterContent = (chapterId) => {
  const chapter = chapters.value.find(c => c.id === chapterId)
  activeChapterFullContent.value = chapter?.content || '（本章暂无内容）'
}

const goToChapter = (index) => {
  const chapter = chapters.value[index]
  if (chapter) {
    activeChapter.value = chapter
    // 滚动到顶部
    document.querySelector('.chapter-content')?.scrollIntoView({ behavior: 'smooth' })
  }
}

const goCreate = () => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('guestMode') === 'true'
  if (token || isGuest) {
    router.push('/novels')
  } else {
    router.push('/login')
  }
}

const shareLink = () => {
  navigator.clipboard.writeText(window.location.href)
  ElMessage.success('阅读链接已复制到剪贴板')
}
</script>

<style scoped>
.public-read-page { min-height: 100vh; background: #f5f7fa; }
.header { background: #fff; border-bottom: 1px solid #e4e7ed; padding: 12px 40px; }
.header-content { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.header-content h2 { margin: 0; font-size: 20px; }
.main-content { max-width: 1400px; margin: 0 auto; padding: 24px 32px; }
.novel-info { display: flex; gap: 16px; align-items: center; color: #909399; font-size: 14px; }
.chapter-section { display: grid; grid-template-columns: 200px 1fr; gap: 24px; margin-top: 20px; }
.chapter-list { max-height: 600px; overflow-y: auto; }
.chapter-item { padding: 8px 12px; cursor: pointer; border-radius: 6px; margin-bottom: 2px; display: flex; gap: 4px; align-items: center; font-size: 13px; }
.chapter-item:hover { background: #f0f0f0; }
.chapter-item.active { background: #ecf5ff; color: #409eff; }
.ch-words { margin-left: auto; font-size: 11px; color: #909399; }
.chapter-content { padding: 24px 32px; background: #fff; border-radius: 12px; min-height: 400px; }
.content-text { white-space: pre-wrap; line-height: 2; font-size: 16px; }
.chapter-nav { display: flex; justify-content: center; align-items: center; gap: 40px; padding: 20px 0; margin-top: 4px; }
.chapter-nav .nav-info { font-size: 13px; color: #909399; }
.cta-section { text-align: center; padding: 40px 0; }

@media (max-width: 768px) {
  .header { padding: 12px 16px; }
  .header-content h2 { font-size: 16px; }
  .main-content { padding: 20px; }
  .chapter-section { grid-template-columns: 1fr; }
}
</style>
