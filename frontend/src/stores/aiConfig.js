import { defineStore } from 'pinia'

export const useAIConfigStore = defineStore('aiConfig', {
  state: () => ({
    apiKey: sessionStorage.getItem('ai_api_key') || '',
    baseURL: sessionStorage.getItem('ai_base_url') || 'https://api.deepseek.com/v1',
    model: sessionStorage.getItem('ai_model') || 'deepseek-chat'
  }),
  
  actions: {
    saveConfig(config) {
      // 验证API Key
      if (!config.apiKey || config.apiKey.trim().length < 10) {
        throw new Error('API Key无效，请检查输入')
      }
      
      this.apiKey = config.apiKey
      this.baseURL = config.baseURL
      this.model = config.model
      
      // 使用sessionStorage代替localStorage，更安全
      sessionStorage.setItem('ai_api_key', config.apiKey)
      sessionStorage.setItem('ai_base_url', config.baseURL)
      sessionStorage.setItem('ai_model', config.model)
    },
    
    getConfig() {
      return {
        apiKey: this.apiKey,
        baseURL: this.baseURL,
        model: this.model
      }
    },
    
    isConfigured() {
      return !!this.apiKey && this.apiKey.length >= 10
    },
    
    // 测试AI连接
    async testConnection(config) {
      try {
        const { apiKey, baseURL, model } = config
        
        // 发送一个简单的测试请求
        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'user', content: 'Hello' }
            ],
            max_tokens: 5
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `API错误: ${response.status}`)
        }
        
        const data = await response.json()
        return {
          success: true,
          model: data.model || model
        }
      } catch (error) {
        console.error('测试连接失败:', error)
        return {
          success: false,
          error: error.message || '连接失败，请检查API Key和网络'
        }
      }
    },
    
    clearConfig() {
      this.apiKey = ''
      this.baseURL = 'https://api.deepseek.com/v1'
      this.model = 'deepseek-chat'
      sessionStorage.removeItem('ai_api_key')
      sessionStorage.removeItem('ai_base_url')
      sessionStorage.removeItem('ai_model')
    }
  }
})
