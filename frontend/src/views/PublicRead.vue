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
.public-read-page {
  min-height: 100vh;
  background: var(--gradient-bg);
  position: relative;
}
.public-read-page::before {
  content: '';
  position: fixed;
  top: -15%; right: -5%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(56,189,248,0.12), transparent 60%);
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
  padding: 12px 40px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-content {
  max-width: 1400px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
}
.header-content h2 {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-content { max-width: 1400px; margin: 0 auto; padding: 24px 32px; animation: fadeIn 0.4s var(--ease-out-expo); }
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.novel-info { display: flex; gap: 16px; align-items: center; color: var(--text-muted); font-size: var(--text-sm); }
.novel-info .author { color: var(--text-secondary); font-weight: 500; }

/* Chapter layout */
.chapter-section { display: grid; grid-template-columns: 220px 1fr; gap: 24px; margin-top: 20px; }

/* Chapter list */
.chapter-list {
  max-height: 600px; overflow-y: auto;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-md));
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-glass);
  padding: 8px;
}
.chapter-item {
  padding: 10px 14px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  margin-bottom: 2px;
  display: flex; gap: 4px; align-items: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: all var(--ease-out-expo) 150ms;
}
.chapter-item:hover { background: var(--gradient-primary-subtle); }
.chapter-item.active {
  background: var(--gradient-primary-subtle);
  color: var(--primary);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--primary);
  border-radius: var(--radius-sm);
}
.ch-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-words { margin-left: auto; font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

/* Chapter content card */
.chapter-content {
  padding: 28px 36px;
  background: var(--bg-elevated);
  backdrop-filter: blur(var(--blur-lg));
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-glass);
  box-shadow: var(--shadow-card);
  min-height: 400px;
}
.chapter-content h4 {
  margin: 0 0 20px;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-light);
}
.content-text {
  white-space: pre-wrap;
  line-height: 2;
  font-size: var(--text-base);
  color: var(--text-primary);
}

/* Chapter nav */
.chapter-nav {
  display: flex; justify-content: center; align-items: center;
  gap: 40px; padding: 20px 0; margin-top: 8px;
}
.nav-info { font-size: var(--text-sm); color: var(--text-muted); font-weight: 500; }

/* CTA */
.cta-section { text-align: center; padding: 48px 0; }
.cta-section p { color: var(--text-secondary); font-size: var(--text-base); margin-bottom: 12px; }

/* Chapter list scrollbar */
.chapter-list::-webkit-scrollbar { width: 4px; }
.chapter-list::-webkit-scrollbar-thumb {
  background: var(--primary-200);
  border-radius: 2px;
}

@media (max-width: 768px) {
  .header { padding: 10px 16px; }
  .header-content h2 { font-size: var(--text-base); }
  .main-content { padding: 20px; }
  .chapter-section { grid-template-columns: 1fr; }
}
</style>
