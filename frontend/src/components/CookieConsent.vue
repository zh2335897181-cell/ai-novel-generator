<template>
  <div v-if="showConsent" class="cookie-consent-banner">
    <div class="cookie-content">
      <div class="cookie-text">
        <el-icon class="cookie-icon"><InfoFilled /></el-icon>
        <div>
          <p class="cookie-title">我们使用 Cookie</p>
          <p class="cookie-description">
            我们使用 Cookie 和类似技术来提供、保护和改进我们的服务。
            继续使用即表示您同意我们的
            <router-link to="/privacy" target="_blank">隐私政策</router-link>。
          </p>
        </div>
      </div>
      <div class="cookie-actions">
        <el-button type="primary" @click="acceptAll" class="accept-btn">
          同意并继续
        </el-button>
        <el-button link @click="showDetails = true" class="details-btn">
          详细了解
        </el-button>
      </div>
    </div>

    <el-dialog
      v-model="showDetails"
      title="Cookie 设置"
      width="500px"
      class="cookie-dialog"
    >
      <div class="cookie-details">
        <div class="cookie-category">
          <div class="category-header">
            <el-checkbox v-model="essential" disabled>
              <strong>必要 Cookie</strong>
            </el-checkbox>
            <span class="required-tag">必需</span>
          </div>
          <p class="category-desc">这些 Cookie 对网站的正常运行至关重要，无法关闭。</p>
          <ul>
            <li>会话管理（保持登录状态）</li>
            <li>安全验证</li>
            <li>基本功能支持</li>
          </ul>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <el-checkbox v-model="analytics">
              <strong>分析 Cookie</strong>
            </el-checkbox>
          </div>
          <p class="category-desc">帮助我们了解用户如何使用网站，以便改进服务。</p>
          <ul>
            <li>访问统计</li>
            <li>错误追踪</li>
            <li>性能分析</li>
          </ul>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <el-checkbox v-model="preferences">
              <strong>偏好 Cookie</strong>
            </el-checkbox>
          </div>
          <p class="category-desc">记住您的设置和偏好，提供更个性化的体验。</p>
          <ul>
            <li>界面主题</li>
            <li>语言设置</li>
            <li>功能偏好</li>
          </ul>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetails = false">取消</el-button>
          <el-button type="primary" @click="savePreferences">保存设置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showConsent = ref(false)
const showDetails = ref(false)
const essential = ref(true)
const analytics = ref(true)
const preferences = ref(true)

onMounted(() => {
  // 检查是否已经同意过
  const consent = localStorage.getItem('cookieConsent')
  if (!consent) {
    showConsent.value = true
  } else {
    // 恢复之前的设置
    try {
      const settings = JSON.parse(consent)
      analytics.value = settings.analytics ?? true
      preferences.value = settings.preferences ?? true
    } catch (e) {
      console.error('解析 Cookie 设置失败', e)
    }
  }
})

const acceptAll = () => {
  saveConsent({
    essential: true,
    analytics: true,
    preferences: true,
    timestamp: Date.now()
  })
  showConsent.value = false
  ElMessage.success('感谢您对 Cookie 设置的理解与支持')
}

const savePreferences = () => {
  saveConsent({
    essential: true,
    analytics: analytics.value,
    preferences: preferences.value,
    timestamp: Date.now()
  })
  showDetails.value = false
  showConsent.value = false
  ElMessage.success('Cookie 偏好设置已保存')
}

const saveConsent = (settings) => {
  localStorage.setItem('cookieConsent', JSON.stringify(settings))
  // 如果用户拒绝分析 Cookie，可以在这里添加相应的处理逻辑
  if (!settings.analytics) {
    // 禁用分析追踪
    window.disableAnalytics = true
  }
}
</script>

<style scoped>
.cookie-consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.cookie-text {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.cookie-icon {
  font-size: 24px;
  color: #e67e22;
  flex-shrink: 0;
  margin-top: 2px;
}

.cookie-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.cookie-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.cookie-description a {
  color: #e67e22;
  text-decoration: none;
  font-weight: 500;
}

.cookie-description a:hover {
  text-decoration: underline;
}

.cookie-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.accept-btn {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  border: none;
}

.details-btn {
  color: #6b7280;
}

/* Cookie 详情弹窗 */
.cookie-details {
  max-height: 400px;
  overflow-y: auto;
}

.cookie-category {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.cookie-category:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.category-header strong {
  color: #1f2937;
  font-size: 15px;
}

.required-tag {
  font-size: 12px;
  color: #e67e22;
  background: rgba(230, 126, 34, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.category-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.cookie-category ul {
  margin: 0;
  padding-left: 24px;
  font-size: 13px;
  color: #6b7280;
}

.cookie-category li {
  margin-bottom: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .cookie-content {
    flex-direction: column;
    text-align: center;
  }

  .cookie-text {
    flex-direction: column;
    align-items: center;
  }

  .cookie-actions {
    width: 100%;
    justify-content: center;
  }

  .accept-btn {
    flex: 1;
  }
}
</style>
