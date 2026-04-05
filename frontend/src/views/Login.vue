<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-icon">
            <el-icon :size="48"><Reading /></el-icon>
          </div>
          <h1>AI小说生成系统</h1>
          <p class="brand-subtitle">基于MySQL外部记忆的智能小说创作平台</p>
        </div>
        
        <div class="features-preview">
          <div class="feature-item">
            <el-icon><Document /></el-icon>
            <span>结构化存储角色状态</span>
          </div>
          <div class="feature-item">
            <el-icon><Lock /></el-icon>
            <span>防止角色复活，保证剧情逻辑</span>
          </div>
          <div class="feature-item">
            <el-icon><Refresh /></el-icon>
            <span>自动追踪物品、地点变化</span>
          </div>
          <div class="feature-item">
            <el-icon><TrendCharts /></el-icon>
            <span>可视化主角成长曲线</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>{{ isRegister ? '注册账号' : '欢迎回来' }}</h2>
            <p>{{ isRegister ? '创建新账号开始创作' : '登录您的账号继续创作' }}</p>
          </div>

          <el-form
            :model="form"
            :rules="rules"
            ref="formRef"
            label-position="top"
            class="login-form"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>

            <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleSubmit"
                style="width: 100%;"
              >
                {{ isRegister ? '注册' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-footer">
            <p v-if="isRegister">
              已有账号？<el-button link type="primary" @click="toggleMode">立即登录</el-button>
            </p>
            <p v-else>
              还没有账号？<el-button link type="primary" @click="toggleMode">立即注册</el-button>
            </p>
          </div>

          <el-divider>或者</el-divider>

          <div class="guest-login">
            <el-button
              size="large"
              @click="guestLogin"
              style="width: 100%;"
            >
              <el-icon><UserFilled /></el-icon>
              游客试用（无需登录）
            </el-button>
            <p class="guest-hint">游客模式的数据仅保存在本地，限时10分钟体验</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Reading, Document, Refresh, TrendCharts, UserFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import { useAIConfigStore } from '../stores/aiConfig'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)
const isRegister = ref(false)

const aiConfigStore = useAIConfigStore()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (isRegister.value && value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应为3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const toggleMode = () => {
  isRegister.value = !isRegister.value
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      if (isRegister.value) {
        await userStore.register(form.username, form.password)
        ElMessage.success('注册成功，请登录')
        isRegister.value = false
        form.password = ''
        form.confirmPassword = ''
      } else {
        const res = await userStore.login(form.username, form.password)
        ElMessage.success('登录成功')
        
        // 检查是否有游客数据需要导入
        if (res.hasGuestData && res.guestNovelCount > 0) {
          const importResult = await ElMessageBox.confirm(
            `检测到 ${res.guestNovelCount} 本游客模式下创建的小说，是否导入到当前账号？`,
            '导入游客数据',
            {
              confirmButtonText: '立即导入',
              cancelButtonText: '放弃数据',
              type: 'info',
              closeOnClickModal: false
            }
          ).catch(() => 'cancel')
          
          if (importResult === 'confirm') {
            // 执行导入
            const result = await userStore.importGuestData()
            if (result.success) {
              ElMessage.success(result.message)
            } else {
              ElMessage.warning(result.message)
            }
          } else {
            // 用户选择放弃，清除游客数据
            userStore.clearGuestData()
            ElMessage.info('游客数据已清除')
          }
        }
        
        router.push('/novels')
      }
    } catch (error) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  })
}

const guestLogin = async () => {
  // 先显示AI API配置提示
  await ElMessageBox.alert(
    `<div style="max-height: 400px; overflow-y: auto; line-height: 1.8;">
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
        <strong style="color: #92400e; font-size: 16px;">⚠️ 重要提示</strong>
        <p style="color: #78350f; margin: 8px 0 0 0;">
          <strong>游客登录后需要自己配置AI API Key才能使用生成故事功能！</strong>
        </p>
      </div>
      
      <h4 style="margin: 16px 0 8px 0; color: #1f2937;">🔥 推荐AI提供商</h4>
      
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <strong style="color: #166534;">DeepSeek（强烈推荐✨）</strong>
        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
          <li>✅ <strong>中文理解能力强</strong>，适合小说创作</li>
          <li>✅ 价格便宜，性价比高</li>
          <li>✅ 支持超长上下文（128K）</li>
        </ul>
        <el-button type="primary" size="small" tag="a" href="https://platform.deepseek.com/api_keys" target="_blank" style="margin-top: 4px;">
          获取 API Key
        </el-button>
      </div>
      
      <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <strong style="color: #1e40af;">OpenAI（行业标杆）</strong>
        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
          <li>✅ <strong>GPT-4质量最高</strong>，适合精品创作</li>
          <li>✅ 功能最全面，生态完善</li>
          <li>⚠️ 价格较贵，需要海外支付</li>
        </ul>
        <el-button type="primary" size="small" tag="a" href="https://platform.openai.com/api-keys" target="_blank" style="margin-top: 4px;">
          获取 API Key
        </el-button>
      </div>
      
      <div style="background: #faf5ff; border: 1px solid #d8b4fe; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
        <strong style="color: #6b21a8;">Anthropic Claude（超长上下文）</strong>
        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
          <li>✅ <strong>200K超长上下文</strong>，适合长篇小说</li>
          <li>✅ 逻辑推理能力强</li>
          <li>⚠️ 价格较贵</li>
        </ul>
        <el-button type="primary" size="small" tag="a" href="https://console.anthropic.com/settings/keys" target="_blank" style="margin-top: 4px;">
          获取 API Key
        </el-button>
      </div>
      
      <div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 12px;">
        <strong style="color: #86198f;">Moonshot（国产，超长上下文）</strong>
        <ul style="margin: 8px 0; padding-left: 20px; color: #374151;">
          <li>✅ <strong>200K超长上下文</strong></li>
          <li>✅ 国产，访问速度快</li>
          <li>✅ 价格适中</li>
        </ul>
        <el-button type="primary" size="small" tag="a" href="https://platform.moonshot.cn/console/api-keys" target="_blank" style="margin-top: 4px;">
          获取 API Key
        </el-button>
      </div>
      
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-top: 16px; border-radius: 4px;">
        <strong style="color: #991b1b;">💡 配置路径：</strong>
        <p style="color: #7f1d1d; margin: 4px 0 0 0;">
          登录后点击右上角 <strong>"AI配置"</strong> 按钮 → 输入获取的API Key → 保存即可使用
        </p>
      </div>
    </div>`,
    '游客登录须知',
    {
      confirmButtonText: '我知道了，继续游客登录',
      dangerouslyUseHTMLString: true,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      type: 'warning'
    }
  )
  
  // 检查是否已经有游客开始时间，避免重复刷新
  const existingStartTime = localStorage.getItem('guestStartTime')
  if (!existingStartTime) {
    // 只有在没有开始时间时才设置新的时间
    const guestStartTime = Date.now()
    localStorage.setItem('guestStartTime', guestStartTime.toString())
  }
  
  localStorage.setItem('guestMode', 'true')
  localStorage.setItem('usageGuideShown', 'true')
  
  userStore.setGuestMode(true)
  ElMessage.success('游客登录成功，限时10分钟体验')
  router.push('/novels')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--gradient-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-section {
  text-align: center;
  margin-bottom: 60px;
}

.brand-icon {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 45%, #a855f7 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 24px;
  box-shadow: 0 16px 40px rgba(251, 113, 133, 0.4);
}

.brand-section h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.features-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  font-size: 15px;
  color: #374151;
}

.feature-item .el-icon {
  color: #fb7185;
  font-size: 20px;
}

.login-right {
  flex: 1;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2933;
}

.login-header p {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  padding-bottom: 8px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
}

.login-footer p {
  font-size: 14px;
  color: #6b7280;
}

.guest-login {
  margin-top: 20px;
}

.guest-hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .login-page {
    padding: 20px;
  }
  
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    padding: 40px 30px;
  }
  
  .brand-section h1 {
    font-size: 24px;
  }
  
  .features-preview {
    display: none;
  }
  
  .login-right {
    padding: 40px 30px;
  }
}
</style>
