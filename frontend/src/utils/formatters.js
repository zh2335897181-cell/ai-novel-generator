/**
 * 格式化工具函数
 */

/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diff = now - target;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return formatDate(date, 'YYYY-MM-DD');
  } else if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else if (minutes > 0) {
    return `${minutes}分钟前`;
  } else {
    return '刚刚';
  }
}

/**
 * 格式化数字
 */
export function formatNumber(num, decimals = 0) {
  if (typeof num !== 'number') return num;
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化字数
 */
export function formatWordCount(count) {
  if (count < 10000) {
    return `${count}字`;
  } else {
    return `${(count / 10000).toFixed(1)}万字`;
  }
}

/**
 * 截断文本
 */
export function truncate(text, length = 100, suffix = '...') {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + suffix;
}

/**
 * 高亮关键词
 */
export function highlightKeywords(text, keywords) {
  if (!text || !keywords) return text;
  
  const regex = new RegExp(`(${keywords})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 解析JSON安全
 */
export function parseJSONSafe(jsonStr, defaultValue = null) {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn('JSON解析失败:', error);
    return defaultValue;
  }
}

/**
 * 字符串化JSON安全
 */
export function stringifyJSONSafe(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON字符串化失败:', error);
    return defaultValue;
  }
}

