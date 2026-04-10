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

          <el-button
            type="primary"
            :plain="aiConfigStore.isConfigured()"
            @click="$router.push('/ai-config')"
            :icon="Cpu"
          >
            {{ aiConfigStore.isConfigured() ? 'AI配置' : '请先配置AI' }}
          </el-button>
          <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
            创建新小说
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
          <h3>{{ novel.title }}</h3>
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
  User, ArrowDown, SwitchButton, Cpu, Delete, Warning, Timer 
} from '@element-plus/icons-vue'
import api from '../api/novel'
import AIConfigDialog from '../components/AIConfigDialog.vue'
import UsageGuideDialog from '../components/UsageGuideDialog.vue'
import { useAIConfigStore } from '../stores/aiConfig'
import { useUserStore } from '../stores/user'

const router = useRouter()
const aiConfigStore = useAIConfigStore()
const userStore = useUserStore()
const novels = ref([])
const showCreateDialog = ref(false)
const showAIConfig = ref(false)
const showUsageGuide = ref(false)
const showDeleteDialog = ref(false)
const novelToDelete = ref(null)
const deleting = ref(false)
const form = ref({ title: '', loading: false })

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
    const res = await api.getNovels()
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
    const res = await api.createNovel(form.value.title)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    form.value.title = ''
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
  /* 让页面底色继承全局多彩深色背景，这里只叠加彩色光斑 */
  background: transparent;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.novel-list::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 600px;
  height: 600px;
  background:
    radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.32) 0%, transparent 60%),
    radial-gradient(circle at 80% 40%, rgba(244, 114, 182, 0.28) 0%, transparent 65%);
  border-radius: 50%;
  animation: float 20s ease-in-out infinite;
}

.novel-list::after {
  content: '';
  position: absolute;
  bottom: -30%;
  left: -5%;
  width: 400px;
  height: 400px;
  background:
    radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.25) 0%, transparent 65%),
    radial-gradient(circle at 90% 10%, rgba(129, 140, 248, 0.25) 0%, transparent 60%);
  border-radius: 50%;
  animation: float 15s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(120deg); }
  66% { transform: translate(-20px, 20px) rotate(240deg); }
}

.header {
  /* 顶部导航改为明亮毛玻璃 */
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 16px 36px rgba(148, 163, 184, 0.28);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 18px;
  animation: slideInLeft 0.6s ease-out;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  /* 可爱二次元多彩渐变图标 */
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 45%, #a855f7 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px rgba(248, 113, 113, 0.55);
  color: #fff;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-section .el-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.logo-section h1 {
  margin: 0;
  font-size: 26px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-subtitle {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
  animation: slideInRight 0.6s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 40px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.novel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.novel-card {
  /* 多彩毛玻璃卡片 */
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.23), transparent 55%),
    radial-gradient(circle at bottom right, rgba(244, 114, 182, 0.22), transparent 55%),
    rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.95);
  animation: scaleIn 0.5s ease-out backwards;
}

.novel-card:nth-child(1) { animation-delay: 0.1s; }
.novel-card:nth-child(2) { animation-delay: 0.2s; }
.novel-card:nth-child(3) { animation-delay: 0.3s; }
.novel-card:nth-child(4) { animation-delay: 0.4s; }
.novel-card:nth-child(5) { animation-delay: 0.5s; }
.novel-card:nth-child(6) { animation-delay: 0.6s; }

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.novel-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.novel-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.4s;
}

.novel-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.35);
  border-color: rgba(102, 126, 234, 0.3);
}

.novel-card:hover::before {
  transform: scaleX(1);
}

.novel-card:hover::after {
  opacity: 1;
}

.novel-card:active {
  transform: translateY(-8px) scale(1.01);
}

.card-icon {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  /* 卡片图标使用柔和糖果色渐变，偏可爱风 */
  background: linear-gradient(135deg, #fb7185 0%, #facc15 35%, #38bdf8 75%, #a855f7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.novel-card:hover .card-icon {
  transform: rotate(5deg) scale(1.1);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
}

.novel-card h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  /* 使用更深的文字颜色以提升在浅色卡片上的对比度 */
  color: #111827;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  letter-spacing: -0.3px;
  transition: color 0.3s;
}

.card-subtitle {
  margin: -12px 0 24px 0;
  font-size: 13px;
  color: #6b7280;
}

.novel-card:hover h3 {
  color: #667eea;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 提升日期等辅助信息的对比度 */
  color: #4b5563;
  font-size: 14px;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.date {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-footer .el-icon {
  transition: transform 0.3s;
}

.novel-card:hover .card-footer .el-icon {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .novel-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .logo-section {
    gap: 12px;
  }
  
  .logo-section h1 {
    font-size: 20px;
  }
  
  .logo-subtitle {
    font-size: 12px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .header-actions .el-button {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    font-size: 13px;
    padding: 8px 12px;
  }
  
  .header-actions .el-dropdown {
    flex: 1 1 calc(50% - 4px);
  }
  
  .header-actions .el-dropdown .el-button {
    width: 100%;
  }
  
  .main-content {
    padding: 24px 20px;
  }
  
  .novel-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .novel-card {
    padding: 20px;
  }
  
  .card-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }
  
  .novel-card h3 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .card-subtitle {
    font-size: 12px;
    margin: -8px 0 16px 0;
  }
  
  /* 移动端对话框优化 */
  .el-dialog {
    width: 90% !important;
  }
  
  /* 游客计时横幅移动端优化 */
  .guest-timer-banner {
    padding: 10px 16px;
    font-size: 13px;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .guest-timer-banner .el-button {
    font-size: 12px;
    padding: 4px 12px;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 12px 16px;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
  }
  
  .logo-icon .el-icon {
    font-size: 20px !important;
  }
  
  .logo-section h1 {
    font-size: 18px;
  }
  
  .logo-subtitle {
    display: none;
  }
  
  .header-actions .el-button {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .main-content {
    padding: 16px 12px;
  }
  
  .novel-card {
    padding: 16px;
  }
  
  .card-icon {
    width: 56px;
    height: 56px;
  }
  
  .novel-card h3 {
    font-size: 16px;
  }
  
  .card-footer {
    font-size: 12px;
  }
  
  /* 小屏幕对话框全屏 */
  .el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    max-height: 100vh;
  }
  
  .el-dialog__body {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
  
  /* 删除确认对话框 */
  .delete-confirm-content {
    padding: 16px 0;
  }
  
  .delete-confirm-content p {
    font-size: 14px;
  }
  
  .delete-warning {
    font-size: 12px !important;
  }
}

/* 删除按钮样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.delete-btn {
  opacity: 0;
  transition: all 0.3s;
  z-index: 2;
}

.novel-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

/* 删除确认对话框样式 */
.delete-confirm-content {
  text-align: center;
  padding: 20px 0;
}

.delete-confirm-content .el-icon {
  margin-bottom: 16px;
}

.delete-confirm-content p {
  margin: 8px 0;
  font-size: 15px;
  color: #374151;
}

.delete-confirm-content strong {
  color: #f56c6c;
  font-weight: 600;
}

.delete-warning {
  font-size: 13px !important;
  color: #9ca3af !important;
  margin-top: 16px !important;
}

/* 游客计时横幅 */
.guest-timer-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000;
  animation: slide-down 0.5s ease-out;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.guest-timer-banner .el-icon {
  font-size: 18px;
}

/* 有横幅时的布局调整 */
:has(.guest-timer-banner) .novel-list .header {
  top: 48px;
}

:has(.guest-timer-banner) .novel-list .main-content {
  padding-top: 96px;
}
</style>

