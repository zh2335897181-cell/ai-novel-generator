import pool from '../config/database.js';

class SensitiveWordService {
  // 缓存相关
  constructor() {
    this.wordCache = null;
    this.cacheTime = 0;
    this.cacheTTL = 5 * 60 * 1000; // 5分钟缓存
  }

  async loadWords() {
    const now = Date.now();
    if (this.wordCache && (now - this.cacheTime) < this.cacheTTL) {
      return this.wordCache;
    }
    const [rows] = await pool.query(
      'SELECT word, severity, replacement FROM sensitive_words WHERE is_active = 1 ORDER BY CHAR_LENGTH(word) DESC'
    );
    this.wordCache = rows;
    this.cacheTime = now;
    return rows;
  }

  invalidateCache() {
    this.wordCache = null;
    this.cacheTime = 0;
  }

  // 过滤文本中的敏感词，返回 { filtered, hits }
  filter(text) {
    if (!text) return { filtered: text, hits: [] };

    let filtered = text;
    const hits = [];

    for (const { word, severity, replacement } of this.wordCache || []) {
      if (filtered.includes(word)) {
        hits.push({ word, severity });
        if (replacement) {
          filtered = filtered.replaceAll(word, replacement);
        } else {
          filtered = filtered.replaceAll(word, '*'.repeat(word.length));
        }
      }
    }

    return { filtered, hits };
  }

  // 异步版本（加载缓存后过滤）
  async filterAsync(text) {
    await this.loadWords();
    return this.filter(text);
  }

  // 高亮敏感词（返回带 <mark> 标签的HTML）
  highlight(text) {
    if (!text) return '';
    let result = text;
    for (const { word } of this.wordCache || []) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escaped, 'g'), `<mark class="sensitive-highlight">${word}</mark>`);
    }
    return result;
  }

  // 测试过滤效果
  async testFilter(text) {
    await this.loadWords();
    const { filtered, hits } = this.filter(text);
    const highlighted = this.highlight(text);
    return { original: text, filtered, hits, highlighted };
  }
}

export default new SensitiveWordService();
