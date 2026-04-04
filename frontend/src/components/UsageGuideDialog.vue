<template>
  <el-dialog 
    v-model="visible" 
    title="📖 使用说明" 
    width="800px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="usage-guide-dialog"
  >
    <div class="guide-content">
      <div class="guide-header">
        <div class="guide-icon">
          <el-icon :size="48"><Reading /></el-icon>
        </div>
        <h2>欢迎使用 AI小说生成系统</h2>
        <p>基于MySQL外部记忆的智能小说创作平台</p>
      </div>

      <div class="guide-sections">
        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><User /></el-icon>
            <h3>第一步：登录或游客访问</h3>
          </div>
          <div class="section-content">
            <p>选择适合您的使用方式：</p>
            <ol>
              <li><strong>登录账号</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>点击右上角"登录/注册"按钮</li>
                  <li>创建账号或使用已有账号登录</li>
                  <li>数据会关联到您的账号</li>
                </ul>
              </li>
              <li><strong>游客访问</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>在登录页面选择"游客访问"</li>
                  <li>无需注册即可开始使用</li>
                  <li>数据仅保存在本地浏览器</li>
                </ul>
              </li>
            </ol>
            <div class="tip">
              <el-icon><InfoFilled /></el-icon>
              <span>建议注册账号以备份您的小说数据</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Cpu /></el-icon>
            <h3>第二步：配置AI服务（详细）</h3>
          </div>
          <div class="section-content">
            <p>系统支持多种AI提供商，请选择最适合您的：</p>
            <ol>
              <li><strong>DeepSeek（推荐）</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>国产模型，中文创作能力强</li>
                  <li>DeepSeek-V3：性价比高，适合日常创作</li>
                  <li>DeepSeek-R1：推理模型，适合复杂剧情</li>
                  <li>支持128K超长上下文</li>
                  <li>价格：约 ¥8/百万tokens</li>
                </ul>
              </li>
              <li><strong>OpenAI GPT系列</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>GPT-4 Turbo：最高质量，精品创作首选</li>
                  <li>GPT-3.5 Turbo：速度快，成本低</li>
                  <li>支持128K上下文</li>
                  <li>价格：$2-30/百万tokens</li>
                </ul>
              </li>
              <li><strong>Anthropic Claude 3</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>Claude 3 Opus：逻辑能力最强</li>
                  <li>支持200K超长上下文</li>
                  <li>适合复杂世界观和角色关系</li>
                </ul>
              </li>
              <li><strong>Moonshot AI</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>国产模型，支持200K上下文</li>
                  <li>国内访问速度快</li>
                </ul>
              </li>
            </ol>
            <p><strong>配置步骤</strong>：</p>
            <ol>
              <li>点击右上角"AI配置"按钮</li>
              <li>选择AI提供商</li>
              <li>填写API Key（从对应官网获取）</li>
              <li>选择模型版本</li>
              <li>点击"测试连接"验证配置</li>
              <li>保存配置</li>
            </ol>
            <div class="tip">
              <el-icon><Warning /></el-icon>
              <span>API Key仅保存在本地，请妥善保管，不要分享给他人</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Plus /></el-icon>
            <h3>第三步：创建小说</h3>
          </div>
          <div class="section-content">
            <p>开始您的创作之旅：</p>
            <ol>
              <li>点击"创建新小说"按钮</li>
              <li>输入小说标题</li>
              <li>系统自动创建小说项目</li>
              <li>进入小说详情页面</li>
            </ol>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Edit /></el-icon>
            <h3>第三步：设置世界观（详细）</h3>
          </div>
          <div class="section-content">
            <p>构建完整的小说世界，包含多个维度：</p>
            <ol>
              <li><strong>小说类型</strong>：选择玄幻、修仙、武侠、都市、科幻等</li>
              <li><strong>写作风格</strong>：详细设定语言风格、叙事节奏、描写方式、对话风格、情感基调</li>
              <li><strong>世界规则</strong>：如修仙体系、魔法等级、武功境界等核心规则</li>
              <li><strong>世界背景</strong>：时代背景、地理环境、社会结构等</li>
              <li><strong>境界体系</strong>（可选）：如炼气→筑基→金丹→元婴等升级体系</li>
            </ol>
            <div class="tip">
              <el-icon><InfoFilled /></el-icon>
              <span>详细的写作风格会影响AI生成的文章风格，建议认真填写</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><MagicStick /></el-icon>
            <h3>第四步：AI拆解大纲（可选）</h3>
          </div>
          <div class="section-content">
            <p>已有完整大纲？让AI自动提取要素：</p>
            <ol>
              <li>点击"AI拆解"按钮</li>
              <li>粘贴你的小说大纲文本</li>
              <li>AI自动识别并提取：世界观、角色、境界体系</li>
              <li>系统自动初始化所有设定</li>
            </ol>
            <div class="example-box">
              <h4>大纲示例格式：</h4>
              <p style="font-size: 13px; color: #666; margin: 0;">
                这是一个修仙世界，分为凡人界和仙界。主角张三从炼气期开始修炼...
                配角李四是他师兄，境界为筑基期...
              </p>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><User /></el-icon>
            <h3>第五步：角色管理</h3>
          </div>
          <div class="section-content">
            <p>系统支持多层级角色管理：</p>
            <ol>
              <li><strong>主要角色</strong>：点击"添加"创建主角和核心角色
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>设置角色名、等级/境界</li>
                  <li>填写属性（JSON格式，如{"力量": 10, "智力": 8}）</li>
                  <li>系统会自动追踪角色状态变化</li>
                </ul>
              </li>
              <li><strong>配角管理</strong>：AI自动生成，也可手动管理
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>查看配角的首次出现和最后出现章节</li>
                  <li>管理配角的持有物品和状态</li>
                </ul>
              </li>
            </ol>
            <div class="tip">
              <el-icon><Warning /></el-icon>
              <span>角色死亡后无法复活，主要角色死亡会严重影响剧情走向</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Files /></el-icon>
            <h3>第六步：章节大纲规划</h3>
          </div>
          <div class="section-content">
            <p>智能规划后续章节：</p>
            <ol>
              <li>点击"AI生成"按钮</li>
              <li>选择要生成的章节数量（1-20章）</li>
              <li>AI根据当前世界观和剧情生成章节大纲</li>
              <li>查看每章的标题、大纲、涉及角色/物品/地点</li>
              <li>按大纲生成具体章节内容</li>
            </ol>
            <div class="tip">
              <el-icon><InfoFilled /></el-icon>
              <span>章节大纲会考虑角色成长弧线、物品线索、地点规划</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Box /></el-icon>
            <h3>第七步：物品与地点管理</h3>
          </div>
          <div class="section-content">
            <p>系统自动追踪小说中的关键元素：</p>
            <ol>
              <li><strong>物品系统</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>自动识别小说中出现的物品</li>
                  <li>追踪物品持有者和状态（存在/丢失/损毁）</li>
                  <li>物品类型：武器、丹药、秘籍、材料等</li>
                </ul>
              </li>
              <li><strong>地点系统</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>记录小说中的关键场景</li>
                  <li>追踪地点状态（正常/封闭/毁灭）</li>
                  <li>地点类型：城市、宗门、秘境、遗迹等</li>
                </ul>
              </li>
            </ol>
            <div class="tip">
              <el-icon><InfoFilled /></el-icon>
              <span>丢失/损毁的物品和封闭/毁灭的地点会在后续章节中被禁止使用</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Star /></el-icon>
            <h3>第八步：生成小说</h3>
          </div>
          <div class="section-content">
            <p>智能创作，保持剧情连贯：</p>
            <ol>
              <li>在剧情指令框中输入你的创意
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>例如："让主角遇到神秘商人"</li>
                  <li>例如："主角突破到金丹期"</li>
                  <li>例如："反派角色死亡"</li>
                </ul>
              </li>
              <li>设置生成字数（300-2000字）</li>
              <li>点击"开始生成"，AI会流式输出内容</li>
              <li>AI自动承接上一章结尾，保持连贯</li>
              <li>生成完成后，系统自动：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>提取章节标题和大纲</li>
                  <li>更新角色状态</li>
                  <li>更新物品持有者</li>
                  <li>更新地点状态</li>
                  <li>更新剧情摘要</li>
                </ul>
              </li>
            </ol>
            <div class="example-box">
              <h4>剧情指令示例：</h4>
              <ul>
                <li>"主角突破到金丹期，遭遇天劫"</li>
                <li>"反派张三被主角击败，身受重伤"</li>
                <li>"主角在天元城遇到神秘商人，获得上古秘籍"</li>
                <li>"黑风谷突然发生异变，入口封闭"</li>
                <li>"主角发现青锋剑的真正来历"</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <el-icon :size="24"><Location /></el-icon>
            <h3>第九步：查看与管理</h3>
          </div>
          <div class="section-content">
            <p>小说详情页功能导览：</p>
            <ol>
              <li><strong>左侧边栏</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>世界设定：查看/编辑世界观、写作风格、境界体系</li>
                  <li>主要角色：查看所有主要角色状态</li>
                  <li>配角列表：展开查看配角详细信息</li>
                  <li>章节大纲：查看已规划的章节大纲</li>
                  <li>物品列表：查看所有物品及其持有者</li>
                  <li>地点列表：查看所有关键地点</li>
                  <li>当前剧情：查看最新剧情摘要</li>
                </ul>
              </li>
              <li><strong>主内容区</strong>：
                <ul style="margin-top: 8px; margin-bottom: 8px;">
                  <li>剧情指令输入框</li>
                  <li>字数设置滑块</li>
                  <li>已生成章节列表（带章节标题和大纲）</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div class="section highlight">
          <div class="section-header">
            <el-icon :size="24"><Star /></el-icon>
            <h3>核心优势</h3>
          </div>
          <div class="section-content">
            <div class="features">
              <div class="feature">
                <el-icon><Document /></el-icon>
                <div>
                  <h4>MySQL外部记忆</h4>
                  <p>角色状态结构化存储，防止AI遗忘剧情</p>
                </div>
              </div>
              <div class="feature">
                <el-icon><Lock /></el-icon>
                <div>
                  <h4>强约束系统</h4>
                  <p>死亡角色不可复活，保证剧情逻辑</p>
                </div>
              </div>
              <div class="feature">
                <el-icon><Refresh /></el-icon>
                <div>
                  <h4>智能状态管理</h4>
                  <p>自动提取角色变化，更新世界设定</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="guide-footer">
        <div class="footer-text">
          <p>🎉 现在开始您的创作之旅吧！</p>
          <p>如有问题，请查看详细文档或联系技术支持</p>
        </div>
        <div class="footer-actions">
          <el-button @click="showLater" :icon="Clock">稍后查看</el-button>
          <el-button type="primary" @click="closeGuide" :icon="Check">
            开始使用
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Reading, Setting, Plus, Edit, User, Star, 
  Document, Lock, Refresh, InfoFilled, Warning, Clock, Check,
  MagicStick, Files, Location, Box
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const closeGuide = () => {
  visible.value = false
  emit('close')
  localStorage.setItem('usageGuideShown', 'true')
}

const showLater = () => {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.usage-guide-dialog {
  border-radius: 24px;
}

:deep(.el-dialog) {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-dialog__title) {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.guide-content {
  padding: 32px;
}

.guide-header {
  text-align: center;
  margin-bottom: 40px;
}

.guide-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 45%, #a855f7 90%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 20px;
  box-shadow: 0 12px 30px rgba(251, 113, 133, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.guide-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2933;
}

.guide-header p {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

.guide-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.section.highlight {
  background: linear-gradient(135deg, rgba(251, 113, 133, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%);
  border: 1px solid rgba(251, 113, 133, 0.2);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-header .el-icon {
  color: #fb7185;
  flex-shrink: 0;
}

.section-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2933;
}

.section-content {
  margin-left: 36px;
}

.section-content p {
  margin: 0 0 12px 0;
  color: #4b5563;
  line-height: 1.6;
}

.section-content ol {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.section-content li {
  margin-bottom: 8px;
  color: #374151;
  line-height: 1.5;
}

.section-content strong {
  color: #1f2933;
  font-weight: 600;
}

.tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(56, 189, 248, 0.1);
  border-radius: 8px;
  border-left: 4px solid #38bdf8;
  margin-top: 12px;
}

.tip .el-icon {
  color: #38bdf8;
  flex-shrink: 0;
}

.tip span {
  color: #1e40af;
  font-size: 14px;
}

.example-box {
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.example-box h4 {
  margin: 0 0 12px 0;
  color: #166534;
  font-size: 16px;
  font-weight: 600;
}

.example-box ul {
  margin: 0;
  padding-left: 20px;
}

.example-box li {
  color: #15803d;
  margin-bottom: 6px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.feature .el-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #fb7185 0%, #38bdf8 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.feature h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2933;
}

.feature p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.guide-footer {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
}

.footer-text {
  margin-bottom: 24px;
}

.footer-text p {
  margin: 0 0 8px 0;
  color: #4b5563;
  font-size: 16px;
}

.footer-text p:first-child {
  font-weight: 600;
  color: #1f2933;
}

.footer-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 20px auto;
  }
  
  .guide-content {
    padding: 20px;
  }
  
  .guide-header h2 {
    font-size: 24px;
  }
  
  .section {
    padding: 20px;
  }
  
  .section-content {
    margin-left: 0;
  }
  
  .features {
    gap: 12px;
  }
  
  .feature {
    flex-direction: column;
    text-align: center;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .footer-actions .el-button {
    width: 100%;
  }
}

/* 滚动条样式 */
:deep(.el-dialog__body::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-dialog__body::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.el-dialog__body::-webkit-scrollbar-thumb) {
  background: rgba(251, 113, 133, 0.3);
  border-radius: 3px;
}

:deep(.el-dialog__body::-webkit-scrollbar-thumb:hover) {
  background: rgba(251, 113, 133, 0.5);
}
</style>
