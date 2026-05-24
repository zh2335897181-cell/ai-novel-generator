<template>
  <div class="maintenance-page">
    <div class="maintenance-container">
      <div class="maintenance-icon">
        <el-icon :size="64"><Tools /></el-icon>
      </div>
      <h1 class="maintenance-title">网站维护中</h1>
      <p class="maintenance-desc">
        我们正在进行系统维护与升级，预计很快完成。<br />
        在此期间，管理员仍可正常访问。
      </p>
      <div class="maintenance-actions">
        <el-button type="primary" @click="goLogin" size="large">
          <el-icon><User /></el-icon>管理员登录
        </el-button>
        <el-button @click="retry" text>
          <el-icon><Refresh /></el-icon>刷新重试
        </el-button>
      </div>
      <p class="maintenance-footer">
        如果你是管理员，请在登录后即可正常访问网站。
      </p>
    </div>
  </div>
</template>

<script setup>
import { Tools, User, Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../api/novel'

const router = useRouter()

const goLogin = () => {
  router.push('/login')
}

const retry = async () => {
  try {
    const res = await fetch('/api/maintenance-status')
    const data = await res.json()
    if (!data.maintenance) {
      router.push('/')
    } else {
      ElMessage.info('网站仍在维护中，请等待维护完成')
    }
  } catch {
    ElMessage.warning('无法连接到服务器')
  }
}
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-bg);
  position: relative;
  overflow: hidden;
}

.maintenance-page::before {
  content: '';
  position: fixed;
  top: -15%;
  right: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(56,189,248,0.1), transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}

.maintenance-page::after {
  content: '';
  position: fixed;
  bottom: -10%;
  left: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(129,140,248,0.08), transparent 60%);
  border-radius: 50%;
  pointer-events: none;
}

.maintenance-container {
  text-align: center;
  padding: 48px 40px;
  max-width: 480px;
  width: 90%;
  background: var(--bg-glass, rgba(255,255,255,0.72));
  backdrop-filter: blur(var(--blur-xl, 24px));
  -webkit-backdrop-filter: blur(var(--blur-xl, 24px));
  border: 1px solid var(--border-glass, rgba(0,0,0,0.06));
  border-radius: var(--radius-xl, 16px);
  box-shadow: var(--shadow-card);
  animation: maintenanceFadeIn 0.5s var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1));
  position: relative;
  z-index: 1;
}

@keyframes maintenanceFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.maintenance-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(56,189,248,0.1), rgba(129,140,248,0.1));
  border-radius: 50%;
  color: var(--color-primary, #409EFF);
  margin-bottom: 24px;
}

.maintenance-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.maintenance-desc {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0 0 28px;
}

.maintenance-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.maintenance-footer {
  margin: 24px 0 0;
  font-size: 13px;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .maintenance-container {
    padding: 36px 24px;
  }
  .maintenance-title {
    font-size: 20px;
  }
  .maintenance-icon {
    width: 80px;
    height: 80px;
  }
}
</style>
