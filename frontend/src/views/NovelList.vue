<template>
  <!-- 游客倒计时警告 -->
  <div v-if="isGuest && remainingMs > 0" class="guest-timer-banner">
    <el-icon><Timer /></el-icon>
    <span>游客体验剩余 {{ formatRemainingTime() }}，登录后解锁无限时长</span>
    <el-button type="primary" size="small" @click="goToLogin">
      立即登录
    </el-button>
  </div>

  <div class="novel-list">
    <div class="header">
      <div class="header-content">
        <div class="logo-section" @click="goToLanding" style="cursor: pointer;">
          <div class="logo-icon">
            <el-icon :size="32"><Reading /></el-icon>
          </div>
          <div class="logo-text">
            <h1>一点纸墨</h1>
            <p class="logo-subtitle">用 AI 打造有世界观、有角色成长的长篇小说</p>
          </div>
        </div>
        <div class="header-actions">
          <!-- 用户菜单 -->
          <el-dropdown v-if="userStore.isLoggedIn || userStore.isGuest" @command="handleUserCommand">
            <el-button>
              <el-icon><User /></el-icon>
              {{ userStore.username }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="ai-config">
                  <el-icon><Setting /></el-icon>
                  AI配置
                </el-dropdown-item>
                <el-dropdown-item command="guide">
                  <el-icon><Reading /></el-icon>
                  使用说明
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-else @click="$router.push('/login')" type="primary">
            <el-icon><User /></el-icon>
            登录 / 注册
          </el-button>

          <!-- 黑白主题切换 -->
          <el-button size="small" @click="themeStore.toggle()">
            <el-icon><Sunny v-if="!themeStore.isDark" /><Moon v-else /></el-icon>
            {{ themeStore.isDark ? '黑底白字' : '白底黑字' }}
          </el-button>

          <el-button
            :class="['ai-config-btn', themeStore.isDark ? 'dark-mode' : 'light-mode']"
            @click="$router.push('/ai-config')"
            :icon="Cpu"
          >
            {{ aiConfigStore.isConfigured() ? 'AI配置' : '请先配置AI' }}
          </el-button>
          <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
            创建新小说
          </el-button>
          <el-select
            v-model="categoryFilter"
            placeholder="全部分类"
            clearable
            style="width: 140px; margin-left: 8px"
            @change="loadNovels"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
          <el-button @click="$router.push('/bookshelf')" style="margin-left: 8px">
            <el-icon><Reading /></el-icon>公共书架
          </el-button>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div v-if="novels.length === 0" class="empty-state">
        <el-empty description="还没有小说">
          <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
            创建第一个小说
          </el-button>
        </el-empty>
      </div>

      <div v-else class="novel-grid">
        <div 
          v-for="novel in novels" 
          :key="novel.id" 
          class="novel-card"
          @click="goToDetail(novel.id)"
        >
          <div class="card-header">
            <div class="card-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
            <el-button 
              class="delete-btn" 
              type="danger" 
              :icon="Delete" 
              circle 
              size="small"
              @click.stop="confirmDelete(novel)"
              title="删除小说"
            />
          </div>
          <h3>{{ novel.title }}
            <el-tag v-if="novel.is_owner === 0" size="small" type="warning" style="margin-left: 8px">
              {{ novel.collab_permission === 'edit' ? '协作编辑' : '协作查看' }}
            </el-tag>
          </h3>
          <el-tag v-if="novel.category" size="small" type="info" class="category-tag">{{ novel.category }}</el-tag>
          <p class="card-subtitle">点击继续创作，让剧情自然推进</p>
          <div class="card-footer">
            <span class="date">{{ formatDate(novel.created_at) }}</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建小说对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建新小说" width="500px">
      <el-form :model="form">
        <el-form-item label="小说标题">
          <el-input
            v-model="form.title"
            placeholder="请输入小说标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="小说分类">
          <el-select v-model="form.category" placeholder="选择小说分类" clearable style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createNovel" :loading="form.loading">创建</el-button>
      </template>
    </el-dialog>

    <!-- AI配置对话框 -->
    <AIConfigDialog v-model="showAIConfig" />
    
    <!-- 使用说明弹窗 -->
    <UsageGuideDialog v-model="showUsageGuide" />
    <!-- 删除确认对话框 -->
    <el-dialog v-model="showDeleteDialog" title="确认删除" width="400px">
      <div class="delete-confirm-content">
        <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
        <p>确定要删除小说「<strong>{{ novelToDelete?.title }}</strong>」吗？</p>
        <p class="delete-warning">此操作不可恢复，所有相关数据（章节、角色、世界观等）都将被永久删除。</p>
      </div>
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="deleteNovel" :loading="deleting">
          <el-icon><Delete /></el-icon> 确认删除
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Setting, Document, ArrowRight, Reading,
  User, ArrowDown, SwitchButton, Cpu, Delete, Warning, Timer, Sunny, Moon
} from '@element-plus/icons-vue'
import api from '../api/novel'
import AIConfigDialog from '../components/AIConfigDialog.vue'
import UsageGuideDialog from '../components/UsageGuideDialog.vue'
import { useAIConfigStore } from '../stores/aiConfig'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const aiConfigStore = useAIConfigStore()
const userStore = useUserStore()
const themeStore = useThemeStore()
const novels = ref([])
const showCreateDialog = ref(false)
const showAIConfig = ref(false)
const showUsageGuide = ref(false)
const showDeleteDialog = ref(false)
const novelToDelete = ref(null)
const deleting = ref(false)
const form = ref({ title: '', category: '', loading: false })
const categoryFilter = ref('')

const categories = [
  '玄幻', '奇幻', '武侠', '仙侠', '都市', '现实',
  '军事', '历史', '游戏', '体育', '科幻', '悬疑',
  '轻小说', '言情', '谴责', '侦探', '科学幻想',
  '推理', '惊险', '纪实', '动漫', '乡土', '耽美'
]

const goToLogin = () => {
  router.push('/login')
}

const goToLanding = () => {
  router.push('/')
}

const handleUserCommand = async (command) => {
  switch (command) {
    case 'ai-config':
      router.push('/ai-config')
      break
    case 'guide':
      showUsageGuide.value = true
      break
    case 'logout':
      await userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

// 游客计时相关
const isGuest = ref(false)
const remainingMs = ref(0)
let guestTimer = null

// 格式化剩余时间
const formatRemainingTime = () => {
  const ms = remainingMs.value
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10) // 显示到百分之一秒
  
  return `${mins}分${secs}秒${milliseconds.toString().padStart(2, '0')}`
}

// 检查游客时间限制
const checkGuestTimer = () => {
  // 如果计时已暂停，不执行跳转
  if (userStore.isTimerPaused) {
    return
  }
  
  const result = userStore.checkGuestTimeLimit()
  
  if (result.isExpired) {
    ElMessage.warning('体验时间已结束，请登录继续使用')
    router.push('/login')
    return
  }
  
  if (result.remainingMs !== null) {
    isGuest.value = true
    remainingMs.value = result.remainingMs
  }
}

const loadNovels = async () => {
  try {
    const res = await api.getNovels(categoryFilter.value || undefined)
    novels.value = res.data ?? []
  } catch (error) {
    ElMessage.error('加载失败：' + (error.message || '请确认后端已启动'))
  }
}

const createNovel = async () => {
  if (!form.value.title) {
    ElMessage.warning('请输入标题')
    return
  }
  if (form.value.loading) return
  form.value.loading = true

  try {
    const res = await api.createNovel(form.value.title, form.value.category || undefined)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    form.value.title = ''
    form.value.category = ''
    form.value.loading = false
    router.push(`/novel/${res.novelId}`)
  } catch (error) {
    ElMessage.error('创建失败: ' + error.message)
    form.value.loading = false
  }
}

const goToDetail = (id) => {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先配置AI')
    router.push('/ai-config')
    return
  }
  router.push(`/novel/${id}`)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const confirmDelete = (novel) => {
  novelToDelete.value = novel
  showDeleteDialog.value = true
}

const deleteNovel = async () => {
  if (!novelToDelete.value) return
  
  deleting.value = true
  try {
    await api.deleteNovel(novelToDelete.value.id)
    ElMessage.success(`「${novelToDelete.value.title}」已删除`)
    showDeleteDialog.value = false
    novelToDelete.value = null
    // 刷新列表
    await loadNovels()
  } catch (error) {
    ElMessage.error('删除失败：' + error.message)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadNovels()
  
  // 检查游客时间限制
  checkGuestTimer()
  
  // 每50ms检查一次游客时间，让倒计时更流畅
  if (userStore.isGuest) {
    guestTimer = setInterval(() => {
      checkGuestTimer()
    }, 50) // 50ms更新一次
  }
  
  // 检查是否首次访问，显示使用说明
  const hasShownGuide = localStorage.getItem('usageGuideShown')
  if (!hasShownGuide) {
    setTimeout(() => {
      showUsageGuide.value = true
    }, 1000)
  }
  
  // 如果AI未配置，提示配置
  if (!aiConfigStore.isConfigured()) {
    setTimeout(() => {
      ElMessage.warning('请先配置AI服务')
    }, 2000)
  }
}) 

// 清理计时器
onUnmounted(() => {
  if (guestTimer) {
    clearInterval(guestTimer)
  }
})
</script>

<style scoped>
.novel-list {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow: hidden;
}

/* Ambient background orbs */
.novel-list::before {
  content: '';
  position: fixed;
  top: -30%;
  right: -5%;
  width: 700px;
  height: 700px;
  background:
    radial-gradient(circle at 30% 30%, rgba(56,189,248,0.25) 0%, transparent 55%),
    radial-gradient(circle at 70% 50%, rgba(244,63,94,0.18) 0%, transparent 60%);
  border-radius: 50%;
  pointer-events: none;
  animation: orbFloat 25s ease-in-out infinite;
}
.novel-list::after {
  content: '';
  position: fixed;
  bottom: -25%;
  left: -5%;
  width: 500px;
  height: 500px;
  background:
    radial-gradient(circle at 10% 80%, rgba(52,211,153,0.18) 0%, transparent 60%),
    radial-gradient(circle at 80% 20%, rgba(168,85,247,0.18) 0%, transparent 55%);
  border-radius: 50%;
  pointer-events: none;
  animation: orbFloat 20s ease-in-out infinite reverse;
}
@keyframes orbFloat {
  0%, 100% { transform: translate(0,0) rotate(0deg); }
  33% { transform: translate(40px,-40px) rotate(120deg); }
  66% { transform: translate(-30px,30px) rotate(240deg); }
}

/* Header - Premium Glass */
.header {
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(var(--blur-xl)) saturate(2);
  -webkit-backdrop-filter: blur(var(--blur-xl)) saturate(2);
  box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(148,163,184,0.12);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-glass);
}
.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}
.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  animation: slideInLeft 0.6s var(--ease-out-expo);
}
.logo-icon {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px var(--primary-glow);
  color: #fff;
  transition: all var(--transition-spring);
}
.logo-section:hover .logo-icon {
  transform: scale(1.08) rotate(-5deg);
  box-shadow: 0 12px 30px var(--primary-glow);
}
.logo-text { display: flex; flex-direction: column; gap: 2px; }
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}
.logo-section h1 {
  margin: 0;
  font-size: 24px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.logo-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  animation: slideInRight 0.6s var(--ease-out-expo);
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 40px 80px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.6s var(--ease-out-expo) both;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 55vh;
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur-lg));
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-glass);
}

/* Novel Grid */
.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* Novel Card - Premium */
.novel-card {
  background: var(--bg-card);
  backdrop-filter: blur(var(--blur-lg));
  -webkit-backdrop-filter: blur(var(--blur-lg));
  border-radius: var(--radius-xl);
  padding: 28px 28px 24px;
  cursor: pointer;
  transition: all var(--transition-spring);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-glass);
  animation: cardIn 0.5s var(--ease-out-expo) backwards;
  isolation: isolate;
}
.novel-card:nth-child(1) { animation-delay: 0.05s; }
.novel-card:nth-child(2) { animation-delay: 0.1s; }
.novel-card:nth-child(3) { animation-delay: 0.15s; }
.novel-card:nth-child(4) { animation-delay: 0.2s; }
.novel-card:nth-child(5) { animation-delay: 0.25s; }
.novel-card:nth-child(6) { animation-delay: 0.3s; }
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Card gradient top bar */
.novel-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s var(--ease-out-expo);
  z-index: 1;
}
/* Card shine overlay */
.novel-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(244,63,94,0.04), transparent 60%),
              radial-gradient(circle at 70% 80%, rgba(56,189,248,0.04), transparent 60%);
  opacity: 0;
  transition: opacity 0.5s var(--ease-out);
  z-index: -1;
}
.novel-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--border-accent);
}
.novel-card:hover::before { transform: scaleX(1); }
.novel-card:hover::after { opacity: 1; }
.novel-card:active { transform: translateY(-4px) scale(0.985); }

/* Card icon */
.card-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 20px;
  box-shadow: 0 8px 20px var(--primary-glow);
  transition: all var(--transition-spring);
  z-index: 1;
  position: relative;
}
.novel-card:hover .card-icon {
  transform: rotate(6deg) scale(1.08);
  box-shadow: 0 12px 28px var(--primary-glow);
}

.novel-card h3 {
  margin: 0 0 8px 0;
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  letter-spacing: -0.02em;
  transition: color var(--transition-fast);
}
.novel-card:hover h3 { color: var(--primary); }

.card-subtitle {
  margin: 0 0 20px 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
}

.category-tag { margin-bottom: 8px; }

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  position: relative;
  z-index: 1;
}
.date { display: flex; align-items: center; gap: 6px; }
.card-footer .el-icon {
  color: var(--text-muted);
  transition: all var(--transition-spring);
}
.novel-card:hover .card-footer .el-icon {
  transform: translateX(6px);
  color: var(--primary);
}

/* Card header with delete button */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0;
}
.delete-btn {
  opacity: 0;
  transform: scale(0.8);
  transition: all var(--transition-spring);
  z-index: 2;
  backdrop-filter: blur(8px);
}
.novel-card:hover .delete-btn { opacity: 1; transform: scale(1); }
.delete-btn:hover { transform: scale(1.15) !important; }

/* Delete confirm dialog */
.delete-confirm-content {
  text-align: center;
  padding: 24px 0;
}
.delete-confirm-content .el-icon { margin-bottom: 16px; }
.delete-confirm-content p { margin: 8px 0; font-size: var(--text-base); color: var(--text-secondary); }
.delete-confirm-content strong { color: var(--danger); font-weight: 600; }
.delete-warning {
  font-size: var(--text-sm) !important;
  color: var(--text-muted) !important;
  margin-top: 16px !important;
}

/* Guest timer banner */
.guest-timer-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--gradient-warm);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 600;
  z-index: 1001;
  animation: slideDown 0.4s var(--ease-out-expo);
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-100%); }
  to { opacity: 1; transform: translateY(0); }
}
.guest-timer-banner .el-icon { font-size: 18px; }

/* ===== Responsive ===== */
@media (max-width: 1200px) {
  .novel-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
}
@media (max-width: 768px) {
  .header-content {
    padding: 14px 20px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .logo-section h1 { font-size: 20px; }
  .logo-subtitle { font-size: 11px; }
  .header-actions { width: 100%; flex-wrap: wrap; gap: 8px; }
  .header-actions .el-button { flex: 1 1 auto; min-width: 0; font-size: 13px; }
  .main-content { padding: 24px 20px 80px; }
  .novel-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .novel-card { padding: 20px 18px; }
  .card-icon { width: 52px; height: 52px; margin-bottom: 16px; }
  .novel-card h3 { font-size: var(--text-base); }
}
@media (max-width: 480px) {
  .header-content { padding: 10px 14px; }
  .logo-icon { width: 36px; height: 36px; }
  .logo-section h1 { font-size: 18px; }
  .logo-subtitle { display: none; }
  .header-actions .el-button { font-size: 12px; padding: 6px 10px; }
  .main-content { padding: 16px 12px 80px; }
  .novel-grid { grid-template-columns: 1fr; gap: 12px; }
  .novel-card { padding: 18px 16px; }
  .card-icon { width: 48px; height: 48px; margin-bottom: 14px; }
  .novel-card h3 { font-size: var(--text-base); }
  .card-footer { font-size: var(--text-xs); }
  .guest-timer-banner { padding: 8px 14px; font-size: 12px; flex-wrap: wrap; gap: 8px; }
}

/* AI配置按钮 - 跟随主题 */
.ai-config-btn.light-mode {
  background: #ffffff;
  color: #1a1a1a;
  border: 1px solid #d1d5db;
}
.ai-config-btn.light-mode:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}
.ai-config-btn.dark-mode {
  background: #1e1e1e;
  color: #e5e7eb;
  border: 1px solid #374151;
}
.ai-config-btn.dark-mode:hover {
  background: #2d2d2d;
  border-color: #6b7280;
}
</style>

