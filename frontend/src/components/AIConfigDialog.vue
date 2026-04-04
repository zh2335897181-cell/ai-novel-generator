<template>
  <el-dialog 
    v-model="visible" 
    title="AI配置" 
    width="600px"
    :close-on-click-modal="false"
    class="ai-config-dialog"
  >
    <div class="dialog-content">
      <el-form :model="form" label-width="100px" label-position="top">
        <div class="info-banner">
          <el-icon class="info-icon"><InfoFilled /></el-icon>
          <div class="info-text">
            <strong>安全提示</strong>
            <p>配置将保存在浏览器本地存储中，仅在本机使用，不会上传到服务器</p>
          </div>
        </div>

        <el-form-item label="API Key" required>
          <el-input 
            v-model="form.apiKey" 
            type="password" 
            show-password
            placeholder="请输入DeepSeek或OpenAI API Key"
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="API地址" required>
          <el-select v-model="form.baseURL" style="width: 100%;" size="large" class="modern-select">
            <el-option label="🚀 DeepSeek" value="https://api.deepseek.com/v1" />
            <el-option label="🤖 OpenAI" value="https://api.openai.com/v1" />
            <el-option label="⚙️ 自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.baseURL === 'custom'" label="自定义地址">
          <el-input 
            v-model="customURL" 
            placeholder="https://your-api.com/v1" 
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="模型" required>
          <el-input 
            v-model="form.model" 
            placeholder="deepseek-chat / gpt-4" 
            size="large"
            class="modern-input"
          >
            <template #prefix>
              <el-icon><Cpu /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-divider content-position="center">
          <span class="divider-text">快速配置</span>
        </el-divider>

        <div class="quick-config">
          <el-button 
            class="config-btn deepseek-btn" 
            @click="useDeepSeek"
            size="large"
          >
            <el-icon><MagicStick /></el-icon>
            DeepSeek
          </el-button>
          <el-button 
            class="config-btn openai-btn" 
            @click="useOpenAI"
            size="large"
          >
            <el-icon><MagicStick /></el-icon>
            OpenAI
          </el-button>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false" size="large">取消</el-button>
        <el-button type="primary" @click="save" size="large" class="save-btn">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, Key, Link, Cpu, MagicStick, Check } from '@element-plus/icons-vue'
import { useAIConfigStore } from '../stores/aiConfig'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const aiConfigStore = useAIConfigStore()
const visible = ref(props.modelValue)
const customURL = ref('')

const form = ref({
  apiKey: aiConfigStore.apiKey,
  baseURL: aiConfigStore.baseURL,
  model: aiConfigStore.model
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    form.value = {
      apiKey: aiConfigStore.apiKey,
      baseURL: aiConfigStore.baseURL,
      model: aiConfigStore.model
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const useDeepSeek = () => {
  form.value.baseURL = 'https://api.deepseek.com/v1'
  form.value.model = 'deepseek-chat'
  ElMessage.success('已切换到 DeepSeek 配置')
}

const useOpenAI = () => {
  form.value.baseURL = 'https://api.openai.com/v1'
  form.value.model = 'gpt-4'
  ElMessage.success('已切换到 OpenAI 配置')
}

const save = () => {
  if (!form.value.apiKey) {
    ElMessage.warning('请输入API Key')
    return
  }

  const finalURL = form.value.baseURL === 'custom' ? customURL.value : form.value.baseURL
  
  aiConfigStore.saveConfig({
    apiKey: form.value.apiKey,
    baseURL: finalURL,
    model: form.value.model
  })

  ElMessage.success({
    message: '配置已保存成功！',
    type: 'success',
    duration: 2000
  })
  visible.value = false
}
</script>

<style scoped>
.ai-config-dialog :deep(.el-dialog) {
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.ai-config-dialog :deep(.el-dialog__header) {
  background: var(--primary-gradient);
  color: white;
  padding: 24px 32px;
  margin: 0;
}

.ai-config-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.ai-config-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

.ai-config-dialog :deep(.el-dialog__body) {
  padding: 32px;
}

.dialog-content {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-banner {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
  border-left: 4px solid var(--primary-color);
  border-radius: var(--border-radius-sm);
  margin-bottom: 28px;
  animation: slideInLeft 0.5s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-icon {
  font-size: 24px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.info-text {
  flex: 1;
}

.info-text strong {
  display: block;
  color: var(--text-primary);
  font-size: 15px;
  margin-bottom: 4px;
}

.info-text p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.el-form-item {
  margin-bottom: 24px;
}

.el-form-item :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  font-size: 14px;
}

.modern-input :deep(.el-input__wrapper) {
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.modern-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.modern-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  border-color: var(--primary-color);
}

.modern-select :deep(.el-select__wrapper) {
  border-radius: var(--border-radius-sm);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.modern-select :deep(.el-select__wrapper:hover) {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.divider-text {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 20px;
}

.config-btn {
  height: 56px;
  border-radius: var(--border-radius-md);
  font-weight: 600;
  font-size: 15px;
  transition: all var(--transition-base);
  border: 2px solid transparent;
}

.deepseek-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.deepseek-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.openai-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
}

.openai-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.save-btn {
  background: var(--primary-gradient);
  border: none;
  min-width: 120px;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-config-dialog :deep(.el-dialog) {
    width: 90% !important;
    margin: 20px auto;
  }
  
  .ai-config-dialog :deep(.el-dialog__body) {
    padding: 24px 20px;
  }
  
  .quick-config {
    grid-template-columns: 1fr;
  }
  
  .dialog-footer {
    padding: 16px 20px;
  }
}
</style>
