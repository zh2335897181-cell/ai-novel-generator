<template>
  <div class="ai-config-page">
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.push('/novels')" class="back-btn">
            <el-icon :size="20"><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="title-section">
            <h1>🤖 AI 服务配置</h1>
            <p class="subtitle">配置您的 AI API 以获得最佳创作体验</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            :loading="testing" 
            @click="testConnection"
            :disabled="!canTest"
          >
            <el-icon><Connection /></el-icon>
            测试连接
          </el-button>
          <el-button type="success" @click="saveConfig" :loading="saving">
            <el-icon><Check /></el-icon>
            保存配置
          </el-button>
        </div>
      </div>
    </div>

    <div class="config-container">
      <div class="config-main">
        <!-- AI 提供商选择 -->
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <el-icon :size="20"><OfficeBuilding /></el-icon>
              <span>选择 AI 提供商</span>
            </div>
          </template>

          <div class="provider-grid">
            <div
              v-for="provider in providers"
              :key="provider.id"
              class="provider-card"
              :class="{ active: selectedProvider === provider.id }"
              @click="selectProvider(provider.id)"
            >
              <div class="provider-icon" :style="{ background: provider.color }">
                <el-icon :size="28"><component :is="provider.icon" /></el-icon>
              </div>
              <div class="provider-info">
                <h3>{{ provider.name }}</h3>
                <p>{{ provider.description }}</p>
                <div class="provider-tags">
                  <el-tag v-for="tag in provider.tags" :key="tag" size="small" :type="tag.type">
                    {{ tag.label }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 详细配置 -->
        <el-card class="config-card" v-if="selectedProvider">
          <template #header>
            <div class="card-header">
              <el-icon :size="20"><Setting /></el-icon>
              <span>详细配置</span>
            </div>
          </template>

          <el-form :model="config" label-width="140px" class="config-form">
            <!-- API Key -->
            <el-form-item label="API Key" required>
              <div class="api-key-input">
                <el-input
                  v-model="config.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  placeholder="请输入您的 API Key"
                  size="large"
                >
                  <template #append>
                    <el-button @click="showApiKey = !showApiKey">
                      <el-icon><View v-if="!showApiKey" /><Hide v-else /></el-icon>
                    </el-button>
                  </template>
                </el-input>
                <el-button 
                  text 
                  type="primary" 
                  @click="openProviderUrl('api')"
                  class="get-key-btn"
                >
                  如何获取？
                </el-button>
              </div>
              <div class="input-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>API Key 仅保存在本地浏览器中，不会上传到服务器</span>
              </div>
            </el-form-item>

            <!-- 基础 URL -->
            <el-form-item label="API 基础 URL">
              <el-input
                v-model="config.baseURL"
                placeholder="https://api.example.com/v1"
                size="large"
              />
              <div class="input-hint">
                默认：{{ currentProvider?.defaultBaseURL || '自动检测' }}
              </div>
            </el-form-item>

            <!-- 模型选择 -->
            <el-form-item label="模型">
              <el-select v-model="config.model" size="large" style="width: 100%;">
                <el-option-group
                  v-for="group in modelGroups"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="model in group.models"
                    :key="model.value"
                    :label="model.label"
                    :value="model.value"
                  >
                    <div class="model-option">
                      <span>{{ model.label }}</span>
                      <el-tag size="small" :type="model.tagType">{{ model.tag }}</el-tag>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>

            <!-- 高级设置折叠面板 -->
            <el-collapse class="advanced-settings">
              <el-collapse-item title="高级设置" name="advanced">
                <!-- 温度参数 -->
                <el-form-item label="Temperature">
                  <div class="slider-with-value">
                    <el-slider v-model="config.temperature" :min="0" :max="2" :step="0.1" />
                    <span class="slider-value">{{ config.temperature }}</span>
                  </div>
                  <div class="input-hint">
                    较低值（0.3-0.7）：输出更确定性、一致<br>
                    较高值（0.8-1.2）：输出更具创造性、多样性
                  </div>
                </el-form-item>

                <!-- 最大 Token -->
                <el-form-item label="最大 Token">
                  <el-input-number
                    v-model="config.maxTokens"
                    :min="1000"
                    :max="8000"
                    :step="1000"
                    size="large"
                  />
                  <div class="input-hint">
                    决定单次生成的最大长度，影响成本和速度
                  </div>
                </el-form-item>

                <!-- 超时设置 -->
                <el-form-item label="超时时间（秒）">
                  <el-input-number
                    v-model="config.timeout"
                    :min="30"
                    :max="300"
                    :step="30"
                    size="large"
                  />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
          </el-form>
        </el-card>

        <!-- 提供商详细信息 -->
        <el-card class="config-card" v-if="currentProvider">
          <template #header>
            <div class="card-header">
              <el-icon :size="20"><Info /></el-icon>
              <span>关于 {{ currentProvider.name }}</span>
            </div>
          </template>

          <div class="provider-details">
            <div class="detail-section">
              <h4>📝 模型特点</h4>
              <ul>
                <li v-for="(feature, index) in currentProvider.features" :key="index">
                  {{ feature }}
                </li>
              </ul>
            </div>

            <div class="detail-section">
              <h4>💰 计费说明</h4>
              <p>{{ currentProvider.pricing }}</p>
              <el-button 
                text 
                type="primary" 
                @click="openProviderUrl('pricing')"
              >
                查看详细定价
              </el-button>
            </div>

            <div class="detail-section">
              <h4>🔒 隐私与安全</h4>
              <p>{{ currentProvider.privacy }}</p>
            </div>

            <div class="detail-section">
              <h4>📖 官方文档</h4>
              <el-button 
                type="primary" 
                plain 
                @click="openProviderUrl('docs')"
              >
                <el-icon><Document /></el-icon>
                查看文档
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 侧边栏：配置状态和建议 -->
      <div class="config-sidebar">
        <el-card class="status-card">
          <template #header>
            <span>配置状态</span>
          </template>
          
          <div class="status-content">
            <div class="status-item">
              <span class="status-label">当前状态</span>
              <el-tag :type="configStatus.type">{{ configStatus.text }}</el-tag>
            </div>
            <div class="status-item" v-if="lastTestResult">
              <span class="status-label">上次测试</span>
              <span :class="['test-result', lastTestResult.success ? 'success' : 'error']">
                {{ lastTestResult.success ? '✅ 成功' : '❌ 失败' }}
              </span>
            </div>
          </div>
        </el-card>

        <el-card class="tips-card">
          <template #header>
            <span>💡 使用建议</span>
          </template>
          
          <div class="tips-content">
            <div class="tip-item" v-for="(tip, index) in usageTips" :key="index">
              <el-icon><Star /></el-icon>
              <span>{{ tip }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="comparison-card">
          <template #header>
            <span>📊 模型对比</span>
          </template>
          
          <el-table :data="modelComparison" size="small">
            <el-table-column prop="provider" label="提供商" width="100" />
            <el-table-column prop="quality" label="文本质量">
              <template #default="{ row }">
                <el-rate v-model="row.quality" disabled show-score />
              </template>
            </el-table-column>
            <el-table-column prop="speed" label="生成速度" width="80">
              <template #default="{ row }">
                <el-tag :type="row.speedType" size="small">{{ row.speed }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, Setting, OfficeBuilding, InfoFilled, Star, Check,
  Connection, View, Hide, Document, MagicStick, ChatLineRound, Cpu
} from '@element-plus/icons-vue'
import { useAIConfigStore } from '../stores/aiConfig'

const router = useRouter()
const aiConfigStore = useAIConfigStore()

// 状态
const selectedProvider = ref('deepseek')
const showApiKey = ref(false)
const testing = ref(false)
const saving = ref(false)
const lastTestResult = ref(null)

// 配置表单
const config = reactive({
  apiKey: '',
  baseURL: '',
  model: '',
  temperature: 0.8,
  maxTokens: 4000,
  timeout: 120
})

// AI 提供商列表
const providers = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '国产大模型，性价比高，擅长中文创作',
    color: '#4A90D9',
    icon: 'ChatLineRound',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    tags: [
      { label: '中文强', type: 'success' },
      { label: '性价比高', type: 'warning' },
      { label: '推荐', type: 'danger' }
    ],
    features: [
      'DeepSeek-V3 模型支持超长上下文（128K）',
      'DeepSeek-R1 推理模型适合复杂剧情设计',
      '中文理解和生成能力优秀',
      '支持 Function Calling 用于结构化数据提取',
      '价格相对OpenAI便宜 90%以上'
    ],
    pricing: '输入：¥2/百万tokens，输出：¥8/百万tokens（V3模型）',
    privacy: '数据存储在中国大陆境内，符合国内数据安全法规',
    urls: {
      api: 'https://platform.deepseek.com/api_keys',
      pricing: 'https://platform.deepseek.com/pricing',
      docs: 'https://platform.deepseek.com/docs'
    },
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek-V3', group: '对话模型', tag: '推荐', tagType: 'success' },
      { value: 'deepseek-reasoner', label: 'DeepSeek-R1', group: '推理模型', tag: '强推理', tagType: 'warning' }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4/GPT-3.5，行业标准，质量稳定',
    color: '#10A37F',
    icon: 'MagicStick',
    defaultBaseURL: 'https://api.openai.com/v1',
    tags: [
      { label: '行业标杆', type: 'success' },
      { label: '质量稳定', type: '' }
    ],
    features: [
      'GPT-4 系列模型质量最高，适合精品创作',
      'GPT-3.5-Turbo 速度快成本低，适合日常创作',
      'GPT-4 Turbo 支持 128K 上下文',
      'DALL-E 3 支持配图生成（需单独配置）',
      'TTS 支持语音合成（需单独配置）'
    ],
    pricing: 'GPT-4：$30/百万tokens，GPT-3.5：$2/百万tokens',
    privacy: '数据可能用于模型改进（可通过企业版避免）',
    urls: {
      api: 'https://platform.openai.com/api-keys',
      pricing: 'https://openai.com/pricing',
      docs: 'https://platform.openai.com/docs'
    },
    models: [
      { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo', group: 'GPT-4', tag: '最强', tagType: 'danger' },
      { value: 'gpt-4', label: 'GPT-4', group: 'GPT-4', tag: '高质量', tagType: 'success' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', group: 'GPT-3.5', tag: '快速', tagType: 'warning' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude 3 系列，超长上下文，逻辑清晰',
    color: '#D97757',
    icon: 'ChatLineRound',
    defaultBaseURL: 'https://api.anthropic.com/v1',
    tags: [
      { label: '超长上下文', type: 'success' },
      { label: '逻辑清晰', type: '' }
    ],
    features: [
      'Claude 3 Opus：最智能模型，适合复杂剧情',
      'Claude 3 Sonnet：平衡智能和速度',
      'Claude 3 Haiku：最快最便宜的模型',
      '支持 200K 上下文（Opus/Sonnet）',
      '拒绝有害请求的能力较强'
    ],
    pricing: 'Opus：$75/百万tokens，Sonnet：$15/百万tokens',
    privacy: '承诺不将API数据用于训练（截至2024年）',
    urls: {
      api: 'https://console.anthropic.com/settings/keys',
      pricing: 'https://www.anthropic.com/pricing',
      docs: 'https://docs.anthropic.com'
    },
    models: [
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', group: 'Claude 3', tag: '最强', tagType: 'danger' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', group: 'Claude 3', tag: '推荐', tagType: 'success' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', group: 'Claude 3', tag: '快速', tagType: 'warning' }
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    description: '月之暗面，超长上下文，中文优化',
    color: '#8B5CF6',
    icon: 'Star',
    defaultBaseURL: 'https://api.moonshot.cn/v1',
    tags: [
      { label: '200K上下文', type: 'success' },
      { label: '国产', type: 'warning' }
    ],
    features: [
      '支持 200K 超长上下文',
      'Kimi 模型中文理解和生成能力强',
      '适合长文档分析和长篇小说创作',
      '支持流式输出',
      '国内访问速度快'
    ],
    pricing: '按量计费，具体查看官网定价',
    privacy: '数据存储在国内，符合数据安全要求',
    urls: {
      api: 'https://platform.moonshot.cn/console/api-keys',
      pricing: 'https://platform.moonshot.cn/docs/pricing',
      docs: 'https://platform.moonshot.cn/docs'
    },
    models: [
      { value: 'moonshot-v1-8k', label: 'Moonshot 8K', group: 'Moonshot', tag: '标准', tagType: '' },
      { value: 'moonshot-v1-32k', label: 'Moonshot 32K', group: 'Moonshot', tag: '长文', type: 'warning' },
      { value: 'moonshot-v1-128k', label: 'Moonshot 128K', group: 'Moonshot', tag: '超长', type: 'success' }
    ]
  },
  {
    id: 'custom',
    name: '自定义/OpenAI兼容',
    description: '其他兼容 OpenAI API 格式的服务商',
    color: '#6B7280',
    icon: 'Cpu',
    defaultBaseURL: '',
    tags: [
      { label: '灵活', type: '' },
      { label: '需配置', type: 'warning' }
    ],
    features: [
      '支持任何兼容 OpenAI API 格式的服务商',
      '如：Azure OpenAI、LocalAI、Ollama 等',
      '需要手动填写完整的 API 基础 URL',
      '需要手动指定模型名称',
      '适合自建模型或使用代理服务'
    ],
    pricing: '根据服务商不同而变化',
    privacy: '取决于选择的服务商',
    urls: {
      api: '#',
      pricing: '#',
      docs: '#'
    },
    models: [
      { value: 'custom', label: '自定义模型', group: '自定义', tag: '手动', type: 'warning' }
    ]
  }
]

// 计算属性
const currentProvider = computed(() => 
  providers.find(p => p.id === selectedProvider.value)
)

const modelGroups = computed(() => {
  const groups = {}
  currentProvider.value?.models.forEach(model => {
    if (!groups[model.group]) {
      groups[model.group] = []
    }
    groups[model.group].push(model)
  })
  return Object.entries(groups).map(([label, models]) => ({ label, models }))
})

const canTest = computed(() => {
  return config.apiKey && config.apiKey.length > 10
})

const configStatus = computed(() => {
  if (!config.apiKey) {
    return { type: 'info', text: '未配置' }
  }
  if (lastTestResult.value?.success) {
    return { type: 'success', text: '已连接' }
  }
  return { type: 'warning', text: '待测试' }
})

const usageTips = [
  '建议先测试连接再保存配置',
  'DeepSeek 性价比最高，适合中文创作',
  'Claude 3 Opus 逻辑能力最强',
  'Temperature 建议设置在 0.7-0.9 之间',
  '首次使用建议从 800 字短章节开始'
]

const modelComparison = [
  { provider: 'DeepSeek', quality: 4.5, speed: '快', speedType: 'success' },
  { provider: 'GPT-4', quality: 5, speed: '中', speedType: 'warning' },
  { provider: 'GPT-3.5', quality: 3.5, speed: '很快', speedType: 'success' },
  { provider: 'Claude 3', quality: 4.8, speed: '中', speedType: 'warning' }
]

// 方法
const selectProvider = (id) => {
  selectedProvider.value = id
  const provider = providers.find(p => p.id === id)
  if (provider) {
    config.baseURL = provider.defaultBaseURL
    config.model = provider.models[0]?.value || ''
  }
}

const openProviderUrl = (type) => {
  const url = currentProvider.value?.urls?.[type]
  if (url && url !== '#') {
    window.open(url, '_blank')
  } else {
    ElMessage.info('请访问官方网站查看详情')
  }
}

const testConnection = async () => {
  if (!canTest.value) {
    ElMessage.warning('请先填写 API Key')
    return
  }
  
  testing.value = true
  try {
    const result = await aiConfigStore.testConnection({
      provider: selectedProvider.value,
      ...config
    })
    
    lastTestResult.value = result
    if (result.success) {
      ElMessage.success(`连接成功！模型：${result.model}`)
    } else {
      ElMessage.error(`连接失败：${result.error}`)
    }
  } catch (error) {
    ElMessage.error('测试连接时出错')
  } finally {
    testing.value = false
  }
}

const saveConfig = async () => {
  if (!config.apiKey) {
    ElMessage.warning('请填写 API Key')
    return
  }
  
  saving.value = true
  try {
    await aiConfigStore.saveConfig({
      provider: selectedProvider.value,
      ...config
    })
    ElMessage.success('配置已保存')
    router.push('/novels')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 初始化
watch(() => selectedProvider.value, (newVal) => {
  selectProvider(newVal)
}, { immediate: true })
</script>

<style scoped>
.ai-config-page {
  min-height: 100vh;
  background: var(--gradient-bg);
  padding-bottom: 40px;
}

.page-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding: 20px 40px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  font-size: 16px;
}

.title-section h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-container {
  max-width: 1400px;
  margin: 30px auto;
  padding: 0 40px;
  display: flex;
  gap: 30px;
}

.config-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-sidebar {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.config-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #1f2933;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.provider-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.provider-card:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.provider-card.active {
  border-color: #fb7185;
  background: rgba(251, 113, 133, 0.1);
}

.provider-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.provider-info h3 {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
}

.provider-info p {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.provider-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.config-form {
  padding: 20px;
}

.api-key-input {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.api-key-input .el-input {
  flex: 1;
}

.get-key-btn {
  padding: 0;
  height: 40px;
}

.input-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-hint .el-icon {
  font-size: 14px;
  color: #38bdf8;
}

.slider-with-value {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-with-value .el-slider {
  flex: 1;
}

.slider-value {
  min-width: 40px;
  font-weight: 600;
  color: #fb7185;
}

.model-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.advanced-settings {
  margin-top: 20px;
}

.provider-details {
  padding: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

.detail-section ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
}

.detail-section li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.detail-section p {
  margin: 0 0 12px 0;
  color: #4b5563;
  line-height: 1.6;
}

.status-card, .tips-card, .comparison-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.status-content {
  padding: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-size: 14px;
  color: #6b7280;
}

.test-result {
  font-size: 14px;
  font-weight: 600;
}

.test-result.success {
  color: #22c55e;
}

.test-result.error {
  color: #ef4444;
}

.tips-content {
  padding: 16px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item .el-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

@media (max-width: 1024px) {
  .config-container {
    flex-direction: column;
  }
  
  .config-sidebar {
    width: 100%;
  }
  
  .provider-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 15px 20px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .config-container {
    padding: 0 20px;
  }
  
  .api-key-input {
    flex-direction: column;
  }
}
</style>
