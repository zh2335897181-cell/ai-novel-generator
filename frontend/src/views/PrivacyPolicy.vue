<template>
  <div class="legal-page">
    <div class="legal-container">
      <div class="legal-header">
        <router-link to="/" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          返回首页
        </router-link>
        <h1>隐私政策</h1>
        <p class="effective-date">生效日期：2026年4月10日</p>
      </div>

      <div class="legal-content">
        <section>
          <h2>1. 引言</h2>
          <p>一点纸墨（以下简称"我们"或"本平台"）高度重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用、存储和保护您的个人信息。使用本平台即表示您同意本隐私政策的条款。</p>
        </section>

        <section>
          <h2>2. 我们收集的信息</h2>
          <h3>2.1 您主动提供的信息</h3>
          <ul>
            <li><strong>账户信息：</strong>用户名、邮箱地址、密码（加密存储）</li>
            <li><strong>创作内容：</strong>您生成的小说标题、章节内容、角色设定等创作数据</li>
            <li><strong>支付信息：</strong>如使用付费功能，我们可能收集必要的支付相关信息（通过第三方支付平台处理，我们不直接存储银行卡信息）</li>
          </ul>

          <h3>2.2 自动收集的信息</h3>
          <ul>
            <li><strong>设备信息：</strong>IP地址、浏览器类型、操作系统</li>
            <li><strong>使用数据：</strong>访问时间、页面浏览记录、功能使用频率</li>
            <li><strong>Cookies：</strong>用于会话管理和用户体验优化</li>
          </ul>
        </section>

        <section>
          <h2>3. 信息使用目的</h2>
          <p>我们使用收集的信息用于：</p>
          <ul>
            <li>提供、维护和改进AI小说生成服务</li>
            <li>创建和管理您的用户账户</li>
            <li>处理您的订阅和支付</li>
            <li>发送服务通知、更新和技术支持信息</li>
            <li>防止欺诈、滥用和非法活动</li>
            <li>分析使用趋势以优化产品体验</li>
          </ul>
        </section>

        <section>
          <h2>4. 数据存储与安全</h2>
          <ul>
            <li>您的数据存储在位于中国的安全服务器上</li>
            <li>我们采用行业标准的加密技术保护数据传输和存储</li>
            <li>密码采用不可逆的哈希算法存储，即使是我们的员工也无法查看您的明文密码</li>
            <li>我们定期进行安全审计和漏洞扫描</li>
          </ul>
        </section>

        <section>
          <h2>5. 数据共享与披露</h2>
          <p>我们<strong>不会</strong>将您的个人信息出售给第三方。仅在以下情况下可能共享数据：</p>
          <ul>
            <li><strong>服务提供商：</strong>与帮助我们运营业务的可信第三方（如支付处理商、云服务提供商）共享，但仅限于提供服务所必需的信息</li>
            <li><strong>法律要求：</strong>应政府部门要求，或为了遵守适用法律、法规而披露</li>
            <li><strong>权益保护：</strong>为了保护我们的合法权益、用户安全或公众利益</li>
          </ul>
        </section>

        <section>
          <h2>6. AI生成内容的处理</h2>
          <ul>
            <li>您使用本平台生成的小说内容属于您的创作成果</li>
            <li>我们仅在为您提供服务所必需的范围内临时处理这些内容（如生成AI回复、存储以便您后续编辑）</li>
            <li>我们不会将您的作品内容用于训练AI模型，也不会向第三方展示或分享</li>
            <li>您随时可以删除您的作品，删除后我们将从服务器永久移除相关数据</li>
          </ul>
        </section>

        <section>
          <h2>7. 用户权利</h2>
          <p>您对自己的个人信息享有以下权利：</p>
          <ul>
            <li><strong>访问权：</strong>查看我们持有的关于您的个人信息</li>
            <li><strong>更正权：</strong>更新或更正不准确的信息</li>
            <li><strong>删除权：</strong>要求删除您的账户和相关数据</li>
            <li><strong>导出权：</strong>导出您的创作内容</li>
            <li><strong>撤回同意：</strong>随时撤回对数据处理的同意（但可能影响服务使用）</li>
          </ul>
          <p>如需行使上述权利，请通过页脚提供的联系方式与我们联系。</p>
        </section>

        <section>
          <h2>8. 儿童隐私</h2>
          <p>本平台不面向14岁以下的儿童。如果我们发现无意中收集了14岁以下儿童的个人信息，我们将立即删除。</p>
        </section>

        <section>
          <h2>9. 隐私政策更新</h2>
          <p>我们可能会不时更新本隐私政策。重大变更将通过平台通知或邮件告知您。继续使用本平台即表示您接受修订后的政策。</p>
        </section>

        <section>
          <h2>10. 联系我们</h2>
          <p>如果您对本隐私政策有任何疑问或顾虑，请通过以下方式联系我们：</p>
          <p class="contact-info">邮箱：privacy@yidianzhimo.com</p>
        </section>
      </div>

      <div class="legal-footer">
        <p>© 2026 一点纸墨. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fefcf8 0%, #faf6f0 100%);
  padding: 40px 20px;
}

.legal-container {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.legal-header {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  color: #fff;
  padding: 40px;
  text-align: center;
  position: relative;
}

.back-link {
  position: absolute;
  left: 20px;
  top: 20px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #fff;
}

.legal-header h1 {
  font-size: 32px;
  margin: 0 0 12px 0;
  font-weight: 600;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', cursive, serif;
  letter-spacing: 3px;
}

.effective-date {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.legal-content {
  padding: 40px;
}

section {
  margin-bottom: 32px;
}

section:last-child {
  margin-bottom: 0;
}

h2 {
  font-size: 20px;
  color: #8b4513;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e67e22;
  font-weight: 600;
  font-family: 'STKaiti', 'KaiTi', 'SimKaiti', cursive, serif;
}

h3 {
  font-size: 16px;
  color: #5d4e37;
  margin: 20px 0 12px 0;
  font-weight: 600;
}

p {
  font-size: 15px;
  line-height: 1.8;
  color: #5d4e37;
  margin: 0 0 12px 0;
}

ul {
  margin: 12px 0;
  padding-left: 24px;
}

li {
  font-size: 15px;
  line-height: 1.8;
  color: #5d4e37;
  margin-bottom: 8px;
}

strong {
  color: #8b4513;
  font-weight: 600;
}

.contact-info {
  background: linear-gradient(135deg, rgba(230, 126, 34, 0.1) 0%, rgba(211, 84, 0, 0.05) 100%);
  padding: 16px 20px;
  border-radius: 4px;
  border-left: 3px solid #e67e22;
  font-weight: 500;
  margin-top: 12px;
}

.legal-footer {
  background: #f8f5f0;
  padding: 20px 40px;
  text-align: center;
  border-top: 1px solid #e8e0d5;
}

.legal-footer p {
  margin: 0;
  font-size: 13px;
  color: #8b7355;
}

@media (max-width: 768px) {
  .legal-page {
    padding: 0;
  }
  
  .legal-container {
    border-radius: 0;
    box-shadow: none;
  }
  
  .legal-header {
    padding: 60px 20px 30px;
  }
  
  .back-link {
    top: 16px;
    left: 16px;
  }
  
  .legal-header h1 {
    font-size: 24px;
  }
  
  .legal-content {
    padding: 24px 20px;
  }
  
  h2 {
    font-size: 18px;
  }
  
  p, li {
    font-size: 14px;
  }
}
</style>
