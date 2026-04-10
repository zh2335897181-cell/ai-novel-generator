<template>
  <div class="mobile-test">
    <div class="test-header">
      <h1>移动端测试页面</h1>
      <p>当前视口: {{ viewportWidth }}px × {{ viewportHeight }}px</p>
      <p>设备类型: {{ deviceType }}</p>
    </div>

    <div class="test-sections">
      <!-- 按钮测试 -->
      <section class="test-section">
        <h2>按钮测试</h2>
        <div class="button-group">
          <el-button type="primary">主要按钮</el-button>
          <el-button>默认按钮</el-button>
          <el-button type="success">成功按钮</el-button>
          <el-button type="warning">警告按钮</el-button>
          <el-button type="danger">危险按钮</el-button>
        </div>
        <div class="button-group">
          <el-button type="primary" size="large">大按钮</el-button>
          <el-button type="primary">默认大小</el-button>
          <el-button type="primary" size="small">小按钮</el-button>
        </div>
      </section>

      <!-- 表单测试 -->
      <section class="test-section">
        <h2>表单测试</h2>
        <el-form :model="form" label-width="80px">
          <el-form-item label="文本输入">
            <el-input v-model="form.text" placeholder="请输入文本" />
          </el-form-item>
          <el-form-item label="多行文本">
            <el-input v-model="form.textarea" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="选择器">
            <el-select v-model="form.select" placeholder="请选择">
              <el-option label="选项1" value="1" />
              <el-option label="选项2" value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="滑块">
            <el-slider v-model="form.slider" />
          </el-form-item>
        </el-form>
      </section>

      <!-- 卡片测试 -->
      <section class="test-section">
        <h2>卡片测试</h2>
        <div class="card-grid">
          <el-card v-for="i in 4" :key="i" class="test-card">
            <template #header>
              <div class="card-header">
                <span>卡片标题 {{ i }}</span>
                <el-button type="text">操作</el-button>
              </div>
            </template>
            <p>这是卡片内容，用于测试移动端显示效果。</p>
          </el-card>
        </div>
      </section>

      <!-- 对话框测试 -->
      <section class="test-section">
        <h2>对话框测试</h2>
        <el-button type="primary" @click="dialogVisible = true">打开对话框</el-button>
        <el-dialog v-model="dialogVisible" title="测试对话框" width="500px">
          <p>这是对话框内容，用于测试移动端自适应。</p>
          <el-form :model="form" label-width="80px">
            <el-form-item label="输入框">
              <el-input v-model="form.text" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="dialogVisible = false">确定</el-button>
          </template>
        </el-dialog>
      </section>

      <!-- 菜单测试 -->
      <section class="test-section">
        <h2>菜单测试</h2>
        <el-menu default-active="1" class="test-menu">
          <el-sub-menu index="1">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>菜单项1</span>
            </template>
            <el-menu-item index="1-1">子项1-1</el-menu-item>
            <el-menu-item index="1-2">子项1-2</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="2">
            <template #title>
              <el-icon><User /></el-icon>
              <span>菜单项2</span>
            </template>
            <el-menu-item index="2-1">子项2-1</el-menu-item>
            <el-menu-item index="2-2">子项2-2</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </section>

      <!-- 触摸测试 -->
      <section class="test-section">
        <h2>触摸测试</h2>
        <div class="touch-area" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
          <p>触摸次数: {{ touchCount }}</p>
          <p>{{ touchStatus }}</p>
        </div>
      </section>

      <!-- 滚动测试 -->
      <section class="test-section">
        <h2>滚动测试</h2>
        <div class="scroll-area">
          <p v-for="i in 20" :key="i">滚动内容行 {{ i }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Document, User } from '@element-plus/icons-vue'

const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)
const deviceType = ref('')
const dialogVisible = ref(false)
const touchCount = ref(0)
const touchStatus = ref('等待触摸...')

const form = ref({
  text: '',
  textarea: '',
  select: '',
  slider: 50
})

const updateViewport = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  
  if (viewportWidth.value <= 480) {
    deviceType.value = '小屏手机'
  } else if (viewportWidth.value <= 768) {
    deviceType.value = '移动设备'
  } else if (viewportWidth.value <= 1024) {
    deviceType.value = '平板设备'
  } else {
    deviceType.value = '桌面设备'
  }
}

const handleTouchStart = () => {
  touchStatus.value = '触摸开始'
}

const handleTouchEnd = () => {
  touchCount.value++
  touchStatus.value = '触摸结束'
  setTimeout(() => {
    touchStatus.value = '等待触摸...'
  }, 1000)
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.mobile-test {
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-deep);
}

.test-header {
  text-align: center;
  padding: 20px;
  background: var(--bg-elevated);
  border-radius: var(--radius-lg);
  margin-bottom: 20px;
}

.test-header h1 {
  margin: 0 0 10px 0;
  color: var(--text-primary);
}

.test-header p {
  margin: 5px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-section {
  background: var(--bg-elevated);
  padding: 20px;
  border-radius: var(--radius-lg);
}

.test-section h2 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.test-card {
  min-height: 120px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-menu {
  border: none;
}

.touch-area {
  background: var(--bg-glass);
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 40px;
  text-align: center;
  cursor: pointer;
  user-select: none;
}

.touch-area p {
  margin: 10px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.scroll-area {
  max-height: 200px;
  overflow-y: auto;
  background: var(--bg-glass);
  border-radius: var(--radius-md);
  padding: 16px;
}

.scroll-area p {
  margin: 8px 0;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .mobile-test {
    padding: 12px;
  }
  
  .test-header {
    padding: 16px;
  }
  
  .test-section {
    padding: 16px;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .mobile-test {
    padding: 10px;
  }
  
  .test-header {
    padding: 12px;
  }
  
  .test-header h1 {
    font-size: 20px;
  }
  
  .test-section {
    padding: 12px;
  }
  
  .test-section h2 {
    font-size: 16px;
  }
  
  .touch-area {
    padding: 30px 20px;
  }
}
</style>

