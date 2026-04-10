import { ref } from 'vue';
import { useAIConfigStore } from '../stores/aiConfig';
import { ElMessage } from 'element-plus';

/**
 * AI生成 Composable
 * 封装AI内容生成相关逻辑
 */
export function useAIGeneration() {
  const aiConfigStore = useAIConfigStore();
  const generating = ref(false);
  const streamingContent = ref('');
  const streamingWordCount = ref(0);

  // 流式生成内容
  const generateStream = async (prompt, options = {}) => {
    if (!aiConfigStore.isConfigured()) {
      ElMessage.warning('请先配置AI');
      return null;
    }

    generating.value = true;
    streamingContent.value = '';
    streamingWordCount.value = 0;

    try {
      const config = aiConfigStore.getConfig();
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                streamingContent.value = fullContent;
                streamingWordCount.value = fullContent.length;
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e);
            }
          }
        }
      }

      return fullContent;
    } catch (error) {
      ElMessage.error('生成失败：' + error.message);
      return null;
    } finally {
      generating.value = false;
    }
  };

  // 非流式生成
  const generate = async (prompt, options = {}) => {
    if (!aiConfigStore.isConfigured()) {
      ElMessage.warning('请先配置AI');
      return null;
    }

    generating.value = true;

    try {
      const config = aiConfigStore.getConfig();
      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      ElMessage.error('生成失败：' + error.message);
      return null;
    } finally {
      generating.value = false;
    }
  };

  // 重置状态
  const reset = () => {
    generating.value = false;
    streamingContent.value = '';
    streamingWordCount.value = 0;
  };

  return {
    generating,
    streamingContent,
    streamingWordCount,
    generateStream,
    generate,
    reset
  };
}

