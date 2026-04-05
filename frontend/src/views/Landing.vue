<template>
  <div class="landing-page">
    <!-- 背景动画 -->
    <div class="bg-animation">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>

    <!-- 导航栏 -->
    <nav class="landing-nav">
      <div class="nav-logo">
        <el-icon :size="28"><Reading /></el-icon>
        <span>AI小说生成系统</span>
      </div>
      <div class="nav-actions">
        <el-button type="primary" size="large" @click="goToLogin">
          立即使用 <el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          用 AI 打造
          <span class="gradient-text">世界级小说</span>
        </h1>
        <p class="hero-subtitle">
          智能世界观构建 · 角色成长追踪 · 无限剧情延展<br>
          让创作灵感源源不断
        </p>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-number">10万+</div>
            <div class="stat-label">已生成章节</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5000+</div>
            <div class="stat-label">创作者</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">AI驱动</div>
            <div class="stat-label">智能创作</div>
          </div>
        </div>
        <div class="hero-buttons">
          <el-button type="primary" size="large" class="cta-button" @click="goToLogin">
            <el-icon><MagicStick /></el-icon>
            免费开始创作
          </el-button>
          <el-button size="large" class="secondary-button" @click="scrollToFeatures">
            了解更多
          </el-button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="floating-card card-1">
          <el-icon><Document /></el-icon>
          <span>智能大纲生成</span>
        </div>
        <div class="floating-card card-2">
          <el-icon><User /></el-icon>
          <span>角色关系图</span>
        </div>
        <div class="floating-card card-3">
          <el-icon><TrendCharts /></el-icon>
          <span>写作统计</span>
        </div>
        <div class="main-illustration">
          <div class="book-animation">
            <div class="book-page page-1"></div>
            <div class="book-page page-2"></div>
            <div class="book-page page-3"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能特性 -->
    <section class="features-section" ref="featuresRef">
      <h2 class="section-title">
        <span class="gradient-text">强大功能</span> 助力创作
      </h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon blue">
            <el-icon><MagicStick /></el-icon>
          </div>
          <h3>AI 智能生成</h3>
          <p>基于最新AI技术，一键生成高质量小说内容，支持多种风格</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon pink">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <h3>世界观构建</h3>
          <p>自动构建完整的世界观体系，包括规则、背景、势力分布</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon purple">
            <el-icon><UserFilled /></el-icon>
          </div>
          <h3>角色成长追踪</h3>
          <p>智能追踪角色状态变化，自动记录等级、境界、物品等</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon green">
            <el-icon><Share /></el-icon>
          </div>
          <h3>关系可视化</h3>
          <p>自动生成角色关系图，清晰展示人物之间的关联</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon orange">
            <el-icon><MagicStick /></el-icon>
          </div>
          <h3>灵感库</h3>
          <p>内置丰富的情节模板和写作技巧，激发创作灵感</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon cyan">
            <el-icon><Download /></el-icon>
          </div>
          <h3>多格式导出</h3>
          <p>支持 TXT、Markdown、HTML 等多种格式导出</p>
        </div>
      </div>
    </section>

    <!-- 使用流程 -->
    <section class="process-section">
      <h2 class="section-title">
        三步开启 <span class="gradient-text">创作之旅</span>
      </h2>
      <div class="process-steps">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>配置AI</h3>
            <p>设置您的AI API密钥，支持多种主流AI服务商</p>
          </div>
        </div>
        <div class="step-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>创建小说</h3>
            <p>输入小说标题，AI自动构建初始世界观和角色</p>
          </div>
        </div>
        <div class="step-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>开始创作</h3>
            <p>输入剧情指令，AI为您生成精彩章节内容</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 定价信息 -->
    <section class="pricing-section">
      <h2 class="section-title">
        选择适合您的 <span class="gradient-text">使用方式</span>
      </h2>
      <div class="pricing-cards">
        <div class="pricing-card guest">
          <div class="pricing-header">
            <h3>游客体验</h3>
            <div class="pricing-price">
              <span class="price">免费</span>
              <span class="period">限时10分钟</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><el-icon><Check /></el-icon> 体验所有核心功能</li>
            <li><el-icon><Check /></el-icon> 生成3个章节</li>
            <li><el-icon><Check /></el-icon> 基础世界观构建</li>
            <li class="disabled"><el-icon><Close /></el-icon> 数据永久保存</li>
            <li class="disabled"><el-icon><Close /></el-icon> 无限时长</li>
          </ul>
          <el-button size="large" class="pricing-btn guest-btn" @click="goToGuestLogin">
            游客体验
          </el-button>
        </div>

        <div class="pricing-card pro">
          <div class="pricing-badge">推荐</div>
          <div class="pricing-header">
            <h3>完整版</h3>
            <div class="pricing-price">
              <span class="price">免费</span>
              <span class="period">永久使用</span>
            </div>
          </div>
          <ul class="pricing-features">
            <li><el-icon><Check /></el-icon> 解锁全部功能</li>
            <li><el-icon><Check /></el-icon> 无限章节生成</li>
            <li><el-icon><Check /></el-icon> 完整世界观管理</li>
            <li><el-icon><Check /></el-icon> 数据永久保存</li>
            <li><el-icon><Check /></el-icon> 无限时长创作</li>
          </ul>
          <el-button type="primary" size="large" class="pricing-btn pro-btn" @click="goToLogin">
            注册/登录
          </el-button>
        </div>
      </div>
    </section>

    <!-- 关于我们 -->
    <section class="about-section">
      <h2 class="section-title">
        关于 <span class="gradient-text">我们</span>
      </h2>
      <div class="about-content">
        <div class="about-card">
          <div class="about-icon">
            <el-icon><Reading /></el-icon>
          </div>
          <h3>我们的使命</h3>
          <p>让每个人都能轻松创作出精彩的小说。我们相信，AI技术可以帮助创作者突破灵感瓶颈，将创意变为现实。无论您是专业作家还是写作爱好者，都能在这里找到创作的乐趣。</p>
        </div>
        <div class="about-card">
          <div class="about-icon purple">
            <el-icon><MagicStick /></el-icon>
          </div>
          <h3>核心技术</h3>
          <p>基于最新的大语言模型技术，结合专业的故事结构算法。我们的AI不仅理解剧情逻辑，还能追踪角色成长、管理世界观设定，确保每一章都与前文连贯一致。</p>
        </div>
        <div class="about-card">
          <div class="about-icon green">
            <el-icon><User /></el-icon>
          </div>
          <h3>团队理念</h3>
          <p>由一群热爱文学与技术的创作者组成。我们深知写作的乐趣与挑战，致力于打造最懂创作者的AI工具。您的每一个反馈，都是我们前进的动力。</p>
        </div>
      </div>
      <div class="about-stats">
        <div class="about-stat-item">
          <div class="about-stat-number">2024</div>
          <div class="about-stat-label">创立年份</div>
        </div>
        <div class="about-stat-item">
          <div class="about-stat-number">100%</div>
          <div class="about-stat-label">免费使用</div>
        </div>
        <div class="about-stat-item">
          <div class="about-stat-number">24/7</div>
          <div class="about-stat-label">AI在线</div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>准备好开始创作了吗？</h2>
        <p>加入数千名创作者，用AI将您的创意变为现实</p>
        <el-button type="primary" size="large" class="final-cta" @click="goToLogin">
          <el-icon><MagicStick /></el-icon>
          立即开始创作
        </el-button>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <el-icon><Reading /></el-icon>
          <span>AI小说生成系统</span>
        </div>
        <p class="footer-copyright">© 2026 AI Novel Generator. All rights reserved.</p>
      </div>
    </footer>

    <!-- 游客倒计时提示 -->
    <div v-if="showGuestWarning" class="guest-warning-banner">
      <el-icon><Timer /></el-icon>
      <span>游客体验剩余 {{ formattedTime }}</span>
      <el-button type="primary" size="small" @click="goToLogin">
        立即登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Reading, ArrowRight, MagicStick, Document, 
  User, TrendCharts, OfficeBuilding, UserFilled, 
  Share, Download, Check, Close, Timer 
} from '@element-plus/icons-vue'

import { useUserStore } from '../stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()
const userStore = useUserStore()
const { isLoggedIn } = storeToRefs(userStore)
const featuresRef = ref(null)
const showGuestWarning = ref(false)
const remainingMs = ref(0)
const guestTimer = ref(null)

// 格式化剩余时间为 "X分Y秒Z毫秒"
const formattedTime = computed(() => {
  const ms = remainingMs.value
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  const milliseconds = Math.floor((ms % 1000) / 10) // 显示到百分之一秒
  
  return `${minutes}分${seconds}秒${milliseconds.toString().padStart(2, '0')}`
})

// 滚动到功能区域
const scrollToFeatures = () => {
  featuresRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 跳转到登录页或小说列表（根据登录状态）
const goToLogin = () => {
  // 检查是否已登录或处于游客模式
  const hasToken = !!localStorage.getItem('token')
  const isGuest = localStorage.getItem('guestMode') === 'true'
  
  if (isLoggedIn.value || hasToken || isGuest) {
    router.push('/novels')
  } else {
    router.push('/login')
  }
}

// 游客登录
const goToGuestLogin = async () => {
  // 先检查 IP 是否被锁定
  const isLocked = await userStore.checkGuestIPLock()
  if (isLocked) {
    ElMessage.warning('该设备游客体验次数已用完，请注册账号继续使用')
    router.push('/login')
    return
  }
  
  // 设置游客模式并记录开始时间
  const guestStartTime = Date.now()
  localStorage.setItem('guestMode', 'true')
  localStorage.setItem('guestStartTime', guestStartTime.toString())
  localStorage.setItem('usageGuideShown', 'true')
  
  ElMessage.success('游客登录成功，限时10分钟体验')
  router.push('/novels')
}

// 检查游客状态
onMounted(() => {
  const isGuest = localStorage.getItem('guestMode') === 'true'
  const startTime = parseInt(localStorage.getItem('guestStartTime') || '0')
  
  // 如果是游客模式，暂停计时
  if (isGuest) {
    userStore.pauseGuestTimer()
  }
  
  if (isGuest && startTime) {
    // 更新显示剩余时间（已考虑暂停）
    const result = userStore.checkGuestTimeLimit()
    
    if (result.remainingMs > 0) {
      showGuestWarning.value = true
      remainingMs.value = result.remainingMs
      
      // 每50ms更新倒计时显示，让数字变化更流畅
      const timer = setInterval(() => {
        const newResult = userStore.checkGuestTimeLimit()
        remainingMs.value = newResult.remainingMs
        
        if (newResult.isExpired || newResult.remainingMs <= 0) {
          clearInterval(timer)
          ElMessage.warning('体验时间已结束，请登录继续使用')
          localStorage.removeItem('guestMode')
          localStorage.removeItem('guestStartTime')
          localStorage.removeItem('guestPausedMs')
          router.push('/login')
        }
      }, 50) // 50ms更新一次，让倒计时更流畅
      
      // 保存timer以便清理
      guestTimer.value = timer
    } else {
      // 时间已用完
      localStorage.removeItem('guestMode')
      localStorage.removeItem('guestStartTime')
      localStorage.removeItem('guestPausedMs')
    }
  }
})

// 离开时恢复计时
onUnmounted(() => {
  // 清理倒计时显示timer
  if (guestTimer.value) {
    clearInterval(guestTimer.value)
  }
  
  // 如果是游客模式，恢复计时
  if (userStore.isGuest) {
    userStore.resumeGuestTimer()
  }
})
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #fff;
  position: relative;
  overflow-x: hidden;
}

/* 背景动画 */
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
}

.circle-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -200px;
  right: -200px;
  animation: float 20s ease-in-out infinite;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -100px;
  left: -100px;
  animation: float 15s ease-in-out infinite reverse;
}

.circle-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 10s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, -30px); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
}

/* 导航栏 */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 60px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-logo .el-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Hero Section */
.hero-section {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 120px 60px 60px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 60px;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -1px;
}

.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 18px;
  color: #94a3b8;
  line-height: 1.8;
  margin-bottom: 40px;
}

.hero-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
}

.cta-button {
  padding: 16px 32px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.5);
}

.secondary-button {
  padding: 16px 32px;
  font-size: 16px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.secondary-button:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

/* Hero Visual */
.hero-visual {
  flex: 1;
  position: relative;
  height: 500px;
}

.floating-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 14px;
  animation: float-card 6s ease-in-out infinite;
}

.floating-card .el-icon {
  font-size: 24px;
  color: #667eea;
}

.card-1 {
  top: 20%;
  left: 0;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 0;
  animation-delay: 2s;
}

.card-3 {
  bottom: 20%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes float-card {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.main-illustration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.book-animation {
  width: 200px;
  height: 250px;
  position: relative;
  perspective: 1000px;
}

.book-page {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: flip-page 4s ease-in-out infinite;
}

.page-1 { animation-delay: 0s; z-index: 3; }
.page-2 { animation-delay: 1.3s; z-index: 2; }
.page-3 { animation-delay: 2.6s; z-index: 1; }

@keyframes flip-page {
  0%, 100% { transform: rotateY(0deg); opacity: 1; }
  50% { transform: rotateY(-180deg); opacity: 0.3; }
}

/* Features Section */
.features-section {
  position: relative;
  z-index: 1;
  padding: 100px 60px;
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.feature-icon .el-icon {
  font-size: 32px;
  color: #fff;
}

.feature-icon.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.feature-icon.pink { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.feature-icon.purple { background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); }
.feature-icon.green { background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); }
.feature-icon.orange { background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); }
.feature-icon.cyan { background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%); }

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.feature-card p {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.6;
}

/* Process Section */
.process-section {
  position: relative;
  z-index: 1;
  padding: 100px 60px;
  background: rgba(255, 255, 255, 0.02);
}

.process-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
}

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
}

.step-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.step-content p {
  font-size: 14px;
  color: #94a3b8;
}

.step-arrow {
  color: #667eea;
  font-size: 24px;
}

.step-arrow .el-icon {
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(10px); }
}

/* Pricing Section */
.pricing-section {
  position: relative;
  z-index: 1;
  padding: 100px 60px;
  max-width: 1200px;
  margin: 0 auto;
}

.pricing-cards {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.pricing-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  width: 360px;
  position: relative;
  transition: all 0.3s;
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.pricing-card.pro {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-color: rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.pricing-card.pro:hover {
  transform: scale(1.05) translateY(-8px);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  right: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.pricing-header {
  text-align: center;
  margin-bottom: 30px;
}

.pricing-header h3 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.pricing-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.price {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.period {
  font-size: 14px;
  color: #94a3b8;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 30px;
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  font-size: 14px;
  color: #e2e8f0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pricing-features li.disabled {
  color: #64748b;
}

.pricing-features li .el-icon {
  font-size: 18px;
}

.pricing-features li:not(.disabled) .el-icon {
  color: #22c55e;
}

.pricing-features li.disabled .el-icon {
  color: #ef4444;
}

.pricing-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
}

.guest-btn {
  background: transparent;
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.guest-btn:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

.pro-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* About Section */
.about-section {
  position: relative;
  z-index: 1;
  padding: 100px 60px;
  background: rgba(255, 255, 255, 0.02);
}

.about-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto 60px;
}

.about-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s;
}

.about-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.about-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.about-icon .el-icon {
  font-size: 28px;
  color: #fff;
}

.about-icon.purple {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
}

.about-icon.green {
  background: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
}

.about-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.about-card p {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.8;
}

.about-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  max-width: 600px;
  margin: 0 auto;
  padding-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.about-stat-item {
  text-align: center;
}

.about-stat-number {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.about-stat-label {
  font-size: 14px;
  color: #94a3b8;
}

/* CTA Section */
.cta-section {
  position: relative;
  z-index: 1;
  padding: 100px 60px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 16px;
}

.cta-content p {
  font-size: 18px;
  color: #94a3b8;
  margin-bottom: 40px;
}

.final-cta {
  padding: 18px 48px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
}

.final-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 50px rgba(102, 126, 234, 0.5);
}

/* Footer */
.landing-footer {
  position: relative;
  z-index: 1;
  padding: 40px 60px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #94a3b8;
}

.footer-copyright {
  font-size: 14px;
  color: #64748b;
}

/* Guest Warning Banner */
.guest-warning-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(249, 115, 22, 0.4);
  z-index: 1000;
  animation: slide-up 0.5s ease-out;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.guest-warning-banner .el-icon {
  font-size: 24px;
  color: #fff;
}

.guest-warning-banner span {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding-top: 140px;
  }

  .hero-stats {
    justify-content: center;
  }

  .hero-buttons {
    justify-content: center;
  }

  .hero-visual {
    height: 300px;
    width: 100%;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .process-steps {
    flex-direction: column;
    gap: 30px;
  }

  .step-arrow {
    transform: rotate(90deg);
  }

  .step-arrow .el-icon {
    animation: bounce-vertical 2s ease-in-out infinite;
  }

  @keyframes bounce-vertical {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(10px); }
  }
}

@media (max-width: 768px) {
  .landing-nav {
    padding: 16px 24px;
  }

  .hero-section {
    padding: 120px 24px 60px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-stats {
    flex-direction: column;
    gap: 20px;
  }

  .hero-buttons {
    flex-direction: column;
  }

  .features-section,
  .process-section,
  .pricing-section,
  .about-section,
  .cta-section {
    padding: 60px 24px;
  }

  .section-title {
    font-size: 28px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .about-content {
    grid-template-columns: 1fr;
  }

  .about-stats {
    flex-direction: column;
    gap: 30px;
  }

  .pricing-cards {
    flex-direction: column;
    align-items: center;
  }

  .pricing-card.pro {
    transform: none;
  }

  .pricing-card.pro:hover {
    transform: translateY(-8px);
  }
}
</style>
