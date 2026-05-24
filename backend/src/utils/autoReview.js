import { resolveAIConfig } from './aiClient.js';

/**
 * 调用AI进行内容审核
 * @param {string} content - 待审核的内容
 * @returns {Promise<string>} AI返回的审核结果文本
 */
export async function callAIForContentReview(content) {
  const { apiKey, baseURL, model } = resolveAIConfig();

  if (!apiKey || apiKey === 'your-api-key-here') {
    throw new Error('请先配置 AI API Key');
  }

  const systemPrompt = `你是一个专业的内容审核助手。请对以下用户提交的小说内容进行审核，检查是否存在以下问题：
1. 违法违规内容（色情、暴力、恐怖主义、分裂国家等）
2. 人身攻击、辱骂、歧视言论
3. 垃圾广告、恶意推广
4. 侵犯他人隐私
5. 其他不适合发布的内容

请按以下格式输出审核结果：
【审核结论】：通过 / 需人工复核 / 违规
【风险等级】：低 / 中 / 高
【问题类型】：（如有）列出具体问题类型
【详细说明】：（如有）简要说明问题所在
【建议处理】：给出处理建议`;

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请审核以下内容：\n\n${content.substring(0, 8000)}` }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `AI API错误: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * 解析AI审核结果，提取决策信息
 * @param {string} aiText - AI返回的审核文本
 * @returns {{ decision: 'approved'|'rejected'|'pending', riskLevel: 'low'|'medium'|'high', reason: string }}
 */
export function parseAIReviewDecision(aiText) {
  const result = {
    decision: 'pending',
    riskLevel: 'low',
    reason: ''
  };

  // 提取审核结论
  const conclusionMatch = aiText.match(/【审核结论】[：:]\s*(.+)/);
  if (conclusionMatch) {
    const conclusion = conclusionMatch[1].trim();
    if (conclusion.includes('通过') && !conclusion.includes('需人工复核')) {
      result.decision = 'approved';
    } else if (conclusion.includes('违规')) {
      result.decision = 'rejected';
    } else {
      result.decision = 'pending';
    }
  }

  // 提取风险等级
  const riskMatch = aiText.match(/【风险等级】[：:]\s*(.+)/);
  if (riskMatch) {
    const risk = riskMatch[1].trim();
    if (risk.includes('高')) result.riskLevel = 'high';
    else if (risk.includes('中')) result.riskLevel = 'medium';
    else result.riskLevel = 'low';
  }

  // 组合原因说明
  const parts = [];
  const typeMatch = aiText.match(/【问题类型】[：:]\s*(.+)/);
  if (typeMatch) parts.push(`[问题类型] ${typeMatch[1].trim()}`);

  const detailMatch = aiText.match(/【详细说明】[：:]\s*(.+)/);
  if (detailMatch) parts.push(`[详细说明] ${detailMatch[1].trim()}`);

  const suggestMatch = aiText.match(/【建议处理】[：:]\s*(.+)/);
  if (suggestMatch) parts.push(`[建议处理] ${suggestMatch[1].trim()}`);

  result.reason = parts.join(' | ') || aiText.substring(0, 500);

  return result;
}
