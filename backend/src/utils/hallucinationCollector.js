/**
 * 幻觉案例收集器
 * 用于收集和记录AI生成过程中的幻觉案例，便于后续分析和优化
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HallucinationCollector {
  constructor() {
    this.cases = [];
    this.maxCases = 1000;
    this.storageKey = 'ai_novel_hallucination_cases';
    this.loadCases();
  }

  loadCases() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.cases = JSON.parse(stored);
        console.log(`[HallucinationCollector] 已加载 ${this.cases.length} 个案例`);
      }
    } catch (error) {
      console.error('[HallucinationCollector] 加载案例失败:', error);
      this.cases = [];
    }
  }

  saveCases() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cases));
    } catch (error) {
      console.error('[HallucinationCollector] 保存案例失败:', error);
    }
  }

  addCase(caseData) {
    const newCase = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: caseData.type || 'unknown',
      description: caseData.description || '',
      content: caseData.content || '',
      expected: caseData.expected || '',
      actual: caseData.actual || '',
      severity: caseData.severity || 'low',
      phase: caseData.phase || 'unknown',
      metadata: caseData.metadata || {}
    };

    this.cases.unshift(newCase);

    if (this.cases.length > this.maxCases) {
      this.cases = this.cases.slice(0, this.maxCases);
    }

    this.saveCases();
    console.log(`[HallucinationCollector] 新增案例: ${newCase.id} (${newCase.type})`);

    return newCase;
  }

  addValidationError(type, message, details = {}) {
    return this.addCase({
      type: 'validation_error',
      description: message,
      severity: details.severity || 'medium',
      phase: details.phase || 'validate_updates',
      metadata: details
    });
  }

  addConsistencyError(type, message, details = {}) {
    return this.addCase({
      type: 'consistency_error',
      description: message,
      severity: details.severity || 'high',
      phase: details.phase || 'consistency_check',
      metadata: details
    });
  }

  addRealmError(type, message, details = {}) {
    return this.addCase({
      type: 'realm_error',
      description: message,
      severity: details.severity || 'medium',
      phase: details.phase || 'realm_validation',
      metadata: details
    });
  }

  addContentError(type, message, details = {}) {
    return this.addCase({
      type: 'content_error',
      description: message,
      severity: details.severity || 'low',
      phase: details.phase || 'content_audit',
      metadata: details
    });
  }

  generateId() {
    return `HC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCases(filters = {}) {
    let filtered = [...this.cases];

    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type);
    }

    if (filters.severity) {
      filtered = filtered.filter(c => c.severity === filters.severity);
    }

    if (filters.phase) {
      filtered = filtered.filter(c => c.phase === filters.phase);
    }

    if (filters.startDate) {
      filtered = filtered.filter(c => new Date(c.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(c => new Date(c.timestamp) <= new Date(filters.endDate));
    }

    return filtered;
  }

  getStatistics() {
    const stats = {
      total: this.cases.length,
      byType: {},
      bySeverity: {},
      byPhase: {},
      recentTrend: []
    };

    for (const c of this.cases) {
      stats.byType[c.type] = (stats.byType[c.type] || 0) + 1;
      stats.bySeverity[c.severity] = (stats.bySeverity[c.severity] || 0) + 1;
      stats.byPhase[c.phase] = (stats.byPhase[c.phase] || 0) + 1;
    }

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * dayMs;
      const dayEnd = now - i * dayMs;
      const count = this.cases.filter(c => {
        const t = new Date(c.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
      stats.recentTrend.push({
        date: new Date(dayStart).toISOString().split('T')[0],
        count
      });
    }

    return stats;
  }

  exportCases(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.cases, null, 2);
    }

    if (format === 'csv') {
      const headers = ['id', 'timestamp', 'type', 'description', 'severity', 'phase'];
      const rows = this.cases.map(c => [
        c.id,
        c.timestamp,
        c.type,
        c.description.replace(/,/g, ';'),
        c.severity,
        c.phase
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return '';
  }

  importCases(data, format = 'json') {
    try {
      let imported;
      if (format === 'json') {
        imported = JSON.parse(data);
      }

      if (Array.isArray(imported)) {
        this.cases = [...imported, ...this.cases];
        if (this.cases.length > this.maxCases) {
          this.cases = this.cases.slice(0, this.maxCases);
        }
        this.saveCases();
        return { success: true, count: imported.length };
      }

      return { success: false, error: 'Invalid format' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  clearCases() {
    this.cases = [];
    this.saveCases();
    console.log('[HallucinationCollector] 已清空所有案例');
  }

  getPromptOptimizationSuggestions() {
    const suggestions = [];

    const typeGroups = {};
    for (const c of this.cases) {
      if (!typeGroups[c.type]) {
        typeGroups[c.type] = [];
      }
      typeGroups[c.type].push(c);
    }

    for (const [type, cases] of Object.entries(typeGroups)) {
      const count = cases.length;
      if (count >= 10) {
        suggestions.push({
          priority: 'high',
          type,
          count,
          suggestion: `【${type}】类型幻觉发生${count}次，建议在提示词中添加更多约束`
        });
      } else if (count >= 5) {
        suggestions.push({
          priority: 'medium',
          type,
          count,
          suggestion: `【${type}】类型幻觉发生${count}次，可考虑优化提示词`
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

export default new HallucinationCollector();
export { HallucinationCollector };
