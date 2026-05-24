<template>
  <div class="deep-analysis-page">
    <!-- Header bar -->
    <div class="analysis-header">
      <div class="header-left">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回小说
        </el-button>
        <h2 class="page-title">{{ novelTitle }} <span class="title-suffix">深度分析</span></h2>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          size="large"
          @click="startAnalysis"
          :loading="analyzing"
          :disabled="analyzing"
        >
          <el-icon v-if="!analyzing"><DataAnalysis /></el-icon>
          {{ analyzing ? '分析中...' : analysisResult ? '重新分析' : '开始全面分析' }}
        </el-button>
      </div>
    </div>

    <!-- Progress indicator -->
    <div v-if="analyzing" class="analysis-progress">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="收集内容" :description="stepDescriptions[0]" />
        <el-step title="写作风格分析" :description="stepDescriptions[1]" />
        <el-step title="主题思想分析" :description="stepDescriptions[2]" />
        <el-step title="生成报告" :description="stepDescriptions[3]" />
      </el-steps>
    </div>

    <!-- Streaming preview -->
    <div v-if="analyzing && streamingText" class="streaming-preview">
      <el-card>
        <template #header>
          <div class="card-header-row">
            <el-icon class="pulse-icon"><Loading /></el-icon>
            <span>AI 实时分析过程</span>
            <el-tag size="small" type="warning">实时生成中</el-tag>
          </div>
        </template>
        <div class="streaming-content">{{ streamingText }}</div>
      </el-card>
    </div>

    <!-- Loading skeleton -->
    <el-skeleton v-if="analyzing && !analysisResult && !streamingText" :rows="12" animated style="margin-top: 24px;" />

    <!-- Analysis Results: parse text into sections -->
    <template v-if="analysisResult && parsedSections.length">
      <el-card
        v-for="(section, idx) in parsedSections"
        :key="idx"
        class="analysis-section-card"
        shadow="hover"
      >
        <template #header>
          <div class="section-header">
            <div class="section-title">
              <el-icon :size="22">
                <EditPen v-if="section.level === 2 && section.title.includes('写作')" />
                <Reading v-else-if="section.level === 2 && section.title.includes('主题')" />
                <Star v-else-if="section.level === 2 && section.title.includes('总结')" />
                <DataLine v-else />
              </el-icon>
              <span>{{ section.title }}</span>
            </div>
            <el-tag
              v-if="section.level === 2"
              :type="section.title.includes('写作') ? 'success' : section.title.includes('主题') ? 'warning' : 'primary'"
              effect="plain"
            >
              {{ section.title.includes('写作') ? '写作风格' : section.title.includes('主题') ? '主题思想' : '总结建议' }}
            </el-tag>
          </div>
        </template>

        <!-- Sub-sections as collapsible items -->
        <el-collapse v-if="section.children.length" v-model="expandedSections[idx]" class="analysis-collapse">
          <el-collapse-item
            v-for="(child, cIdx) in section.children"
            :key="cIdx"
            :name="`${idx}-${cIdx}`"
          >
            <template #title>
              <span class="sub-title">{{ child.title }}</span>
            </template>
            <div class="prose-content" v-html="child.htmlContent"></div>
          </el-collapse-item>
        </el-collapse>

        <!-- If no sub-sections, show body directly -->
        <div v-else class="prose-content" v-html="section.htmlContent"></div>
      </el-card>
    </template>

    <!-- Empty state when no analysis yet -->
    <div v-if="!analyzing && !analysisResult" class="empty-state">
      <el-empty description="点击上方按钮开始AI深度分析">
        <template #image>
          <el-icon :size="80" color="#909399"><DataAnalysis /></el-icon>
        </template>
      </el-empty>
      <div class="feature-intro">
        <h3>AI 将生成一篇专业文学评论，涵盖以下方面：</h3>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover" class="intro-card">
              <el-icon :size="28" color="#409eff"><EditPen /></el-icon>
              <h4>写作风格深度剖析</h4>
              <ul>
                <li>叙事视角与手法</li>
                <li>语言风格与修辞</li>
                <li>节奏与张力控制</li>
                <li>对话与描写比例</li>
                <li>情感基调与氛围</li>
              </ul>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-card shadow="hover" class="intro-card">
              <el-icon :size="28" color="#e6a23c"><Reading /></el-icon>
              <h4>主题思想深度解读</h4>
              <ul>
                <li>核心主题识别与分析</li>
                <li>母题与象征符号解析</li>
                <li>哲学内涵与思想深度</li>
                <li>价值观表达探讨</li>
                <li>社会文化隐喻解读</li>
              </ul>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, DataAnalysis, EditPen, Reading, Loading, DataLine, Star } from '@element-plus/icons-vue'
import api from '../api/novel.js'
import { useAIConfigStore } from '../stores/aiConfig.js'

const route = useRoute()
const router = useRouter()
const aiConfigStore = useAIConfigStore()

const novelId = computed(() => route.params.id)
const novelTitle = ref('')
const analyzing = ref(false)
const analysisResult = ref(null)   // raw prose string
const streamingText = ref('')
const currentStep = ref(0)

const stepDescriptions = ref(['准备中...', '等待中...', '等待中...', '等待中...'])
const expandedSections = ref({})

// Parse the raw prose text into a section tree
// Sections: ## 一、XXX => level 2, ### N. XXX => level 3 child of previous level 2
const parsedSections = computed(() => {
  const text = analysisResult.value
  if (!text || typeof text !== 'string') return []

  const lines = text.split('\n')
  const sections = []
  let currentSection = null

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+?)\s*##\s*$/) || line.match(/^##\s+(.+)$/)
    const h3Match = line.match(/^###\s+(.+?)\s*###\s*$/) || line.match(/^###\s+(.+)$/)

    if (h2Match) {
      currentSection = {
        level: 2,
        title: h2Match[1].trim(),
        children: [],
        bodyLines: []
      }
      sections.push(currentSection)
    } else if (h3Match && currentSection) {
      currentSection.children.push({
        level: 3,
        title: h3Match[1].trim(),
        bodyLines: []
      })
    } else if (currentSection && currentSection.children.length > 0) {
      // Add to the last child
      const lastChild = currentSection.children[currentSection.children.length - 1]
      lastChild.bodyLines.push(line)
    } else if (currentSection && currentSection.children.length === 0) {
      // Body text under the h2 directly (no h3 children yet)
      currentSection.bodyLines.push(line)
    }
  }

  // Convert bodyLines to HTML for each section/child
  for (const sec of sections) {
    sec.htmlContent = bodyToHtml(sec.bodyLines)
    for (const child of sec.children) {
      child.htmlContent = bodyToHtml(child.bodyLines)
    }
  }

  return sections
})

function bodyToHtml(lines) {
  // Join lines, then do basic formatting:
  // - Blank-line-separated blocks become paragraphs
  // - Lines that look like list items get <li> wrapping
  let text = lines.join('\n').trim()
  if (!text) return ''

  // Escape HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Split into paragraphs on double newlines
  const blocks = text.split(/\n\n+/)
  const htmlBlocks = blocks.map(block => {
    const trimmed = block.trim()
    if (!trimmed) return ''

    // Check if this block looks like a list (lines starting with -, *, or number.)
    const blockLines = trimmed.split('\n')
    const isList = blockLines.every(l => /^[-*•]\s/.test(l.trim()) || /^\d+[.．、]\s/.test(l.trim()))

    if (isList) {
      const items = blockLines.map(l =>
        `<li>${l.trim().replace(/^[-*•]\s*/, '').replace(/^\d+[.．、]\s*/, '')}</li>`
      ).join('')
      return `<ul>${items}</ul>`
    }

    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`
  })

  return htmlBlocks.filter(Boolean).join('\n')
}

async function startAnalysis() {
  if (!aiConfigStore.isConfigured()) {
    ElMessage.warning('请先在AI配置中设置API Key')
    router.push('/ai-config')
    return
  }

  analyzing.value = true
  streamingText.value = ''
  analysisResult.value = null
  currentStep.value = 0
  stepDescriptions.value = ['准备中...', '等待中...', '等待中...', '等待中...']

  try {
    const aiConfig = aiConfigStore.getConfig()

    await api.analyzeNovelDeeply(novelId.value, aiConfig, (data) => {
      switch (data.type) {
        case 'phase':
          if (data.phase === 'prepare') {
            currentStep.value = 0
            stepDescriptions.value[0] = data.message
          } else if (data.phase === 'writing_style') {
            currentStep.value = 1
            stepDescriptions.value[1] = data.message
          } else if (data.phase === 'theme') {
            currentStep.value = 2
            stepDescriptions.value[2] = data.message
          } else if (data.phase === 'finalize') {
            currentStep.value = 3
            stepDescriptions.value[3] = data.message
          }
          break

        case 'content':
          streamingText.value += data.content
          break

        case 'done':
          analysisResult.value = data.data  // raw prose string
          currentStep.value = 4
          // Auto-expand first section
          if (parsedSections.value.length > 0) {
            expandedSections.value = { 0: ['0-0'] }
          }
          ElMessage.success('深度分析完成！')
          break

        case 'error':
          ElMessage.error(data.message || '分析失败')
          break
      }
    })
  } catch (error) {
    ElMessage.error('分析请求失败：' + error.message)
  } finally {
    analyzing.value = false
  }
}

function goBack() {
  router.push(`/novel/${novelId.value}`)
}

onMounted(async () => {
  try {
    const res = await api.getNovelDetail(novelId.value)
    novelTitle.value = res.data?.novel?.title || '未知小说'
  } catch (e) {
    novelTitle.value = '未知小说'
  }
})
</script>

<style scoped>
.deep-analysis-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  min-height: 100vh;
  background: var(--bg-page, #f5f7fa);
}

/* Header */
.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #303133);
  margin: 0;
}

.title-suffix {
  color: var(--color-primary, #409eff);
  font-weight: 500;
  font-size: 16px;
  margin-left: 8px;
}

/* Progress */
.analysis-progress {
  margin-bottom: 24px;
  padding: 20px 24px;
  background: var(--bg-card, #fff);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Streaming preview */
.streaming-preview {
  margin-bottom: 24px;
}

.streaming-preview :deep(.el-card) {
  border-radius: 12px;
}

.card-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.streaming-content {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Georgia', 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-wrap;
  color: var(--text-regular, #606266);
  padding: 16px;
  background: var(--bg-page, #f5f7fa);
  border-radius: 8px;
}

/* Section cards */
.analysis-section-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #303133);
}

/* Collapse */
.analysis-collapse {
  margin-top: 4px;
}

.sub-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

/* Prose content */
.prose-content {
  padding: 4px 0;
  font-size: 15px;
  line-height: 2;
  color: var(--text-regular, #606266);
}

.prose-content :deep(p) {
  margin: 0 0 14px;
  text-indent: 2em;
}

.prose-content :deep(ul) {
  margin: 8px 0 16px;
  padding-left: 24px;
}

.prose-content :deep(li) {
  margin-bottom: 6px;
  line-height: 1.8;
}

.prose-content :deep(br) {
  display: block;
  content: '';
  margin-top: 4px;
}

/* Empty state */
.empty-state {
  margin-top: 40px;
}

.feature-intro {
  margin-top: 32px;
}

.feature-intro h3 {
  text-align: center;
  font-size: 16px;
  color: var(--text-secondary, #909399);
  margin-bottom: 20px;
}

.intro-card {
  border-radius: 12px;
  text-align: center;
  padding: 16px;
  margin-bottom: 12px;
}

.intro-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  margin: 10px 0;
}

.intro-card ul {
  list-style: none;
  padding: 0;
  text-align: left;
}

.intro-card li {
  font-size: 13px;
  line-height: 2;
  color: var(--text-regular, #606266);
  padding-left: 16px;
  position: relative;
}

.intro-card li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary, #409eff);
}

/* Responsive */
@media (max-width: 768px) {
  .deep-analysis-page {
    padding: 16px 12px 60px;
  }

  .analysis-header {
    padding: 14px 16px;
    flex-direction: column;
    align-items: flex-start;
  }

  .page-title {
    font-size: 18px;
  }
}
</style>
