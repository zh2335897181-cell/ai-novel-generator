<template>
  <div>
    <!-- 悬浮反馈按钮 -->
    <div class="feedback-float-btn" @click="showDialog = true">
      <el-icon><ChatDotRound /></el-icon>
      <span>反馈</span>
    </div>

    <!-- 反馈弹窗 -->
    <el-dialog
      v-model="showDialog"
      title="意见反馈与举报"
      width="550px"
      class="feedback-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="反馈类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button label="bug">功能故障</el-radio-button>
            <el-radio-button label="suggestion">产品建议</el-radio-button>
            <el-radio-button label="content">内容举报</el-radio-button>
            <el-radio-button label="other">其他</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          v-if="form.type === 'content'" 
          label="违规内容类型" 
          prop="violationType"
        >
          <el-select v-model="form.violationType" placeholder="请选择违规类型" style="width: 100%">
            <el-option label="色情低俗" value="pornography" />
            <el-option label="暴力恐怖" value="violence" />
            <el-option label="侵权盗版" value="copyright" />
            <el-option label="虚假信息" value="misinformation" />
            <el-option label="仇恨言论" value="hate" />
            <el-option label="违法违规" value="illegal" />
            <el-option label="其他违规" value="other_violation" />
          </el-select>
        </el-form-item>

        <el-form-item label="详细描述" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            :placeholder="getPlaceholder()"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="联系邮箱（选填）" prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="便于我们回复您，不填亦可"
          />
        </el-form-item>

        <el-form-item v-if="form.type === 'content'">
          <div class="notice-box">
            <el-icon><Warning /></el-icon>
            <div>
              <p><strong>内容举报说明</strong></p>
              <p>我们高度重视内容安全，将在 24 小时内处理您的举报。恶意举报将承担相应法律责任。</p>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitFeedback">
            提交反馈
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ChatDotRound, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const showDialog = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  type: 'suggestion',
  violationType: '',
  content: '',
  email: ''
})

const rules = {
  type: [{ required: true, message: '请选择反馈类型' }],
  violationType: [{ 
    required: true, 
    message: '请选择违规类型',
    trigger: 'change',
    validator: (rule, value, callback) => {
      if (form.type === 'content' && !value) {
        callback(new Error('请选择违规类型'))
      } else {
        callback()
      }
  }}],
  content: [
    { required: true, message: '请输入详细描述', trigger: 'blur' },
    { min: 10, message: '描述至少 10 个字符', trigger: 'blur' }
  ],
  email: [
    { 
      type: 'email', 
      message: '请输入正确的邮箱格式', 
      trigger: 'blur' 
    }
  ]
}

const getPlaceholder = () => {
  switch (form.type) {
    case 'bug':
      return '请描述遇到的问题，包括：1）操作步骤 2）期望结果 3）实际结果'
    case 'suggestion':
      return '请详细描述您的建议，帮助我们改进产品'
    case 'content':
      return '请描述违规内容的具体情况，包括涉及的作品名称、章节等'
    default:
      return '请输入您的反馈内容'
  }
}

const submitFeedback = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      // 这里可以调用后端API提交反馈
      // await feedbackApi.submit(form)
      
      // 模拟提交
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      ElMessage.success('感谢您的反馈，我们将尽快处理')
      showDialog.value = false
      
      // 重置表单
      form.content = ''
      form.violationType = ''
      form.email = ''
    } catch (error) {
      ElMessage.error('提交失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped>
.feedback-float-btn {
  position: fixed;
  right: 20px;
  bottom: 100px;
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
}

.feedback-float-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 126, 34, 0.5);
}

.feedback-float-btn .el-icon {
  font-size: 18px;
}

:deep(.feedback-dialog) {
  border-radius: 8px;
}

:deep(.feedback-dialog .el-dialog__header) {
  background: linear-gradient(135deg, #f8f5f0 0%, #faf6f0 100%);
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e0d5;
}

:deep(.feedback-dialog .el-dialog__title) {
  color: #8b4513;
  font-weight: 600;
}

.notice-box {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.08) 0%, rgba(211, 84, 0, 0.04) 100%);
  border-left: 3px solid #e67e22;
  border-radius: 4px;
}

.notice-box .el-icon {
  font-size: 20px;
  color: #e67e22;
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-box p {
  margin: 0;
  font-size: 13px;
  color: #5d4e37;
  line-height: 1.6;
}

.notice-box p strong {
  color: #8b4513;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .feedback-float-btn {
    right: 12px;
    bottom: 80px;
    padding: 10px 14px;
    font-size: 13px;
  }
  
  .feedback-float-btn span {
    display: none;
  }
}
</style>
