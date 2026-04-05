import WorldStateRepository from '../repositories/WorldStateRepository.js';

/**
 * 世界设定Service
 * 处理世界设定相关的业务逻辑
 */
export class WorldStateService {
  /**
   * 获取世界设定
   */
  async getWorldState(novelId) {
    return await WorldStateRepository.findByNovelId(novelId);
  }

  /**
   * 创建世界设定
   */
  async createWorldState(novelId, worldData = {}) {
    const existing = await WorldStateRepository.findByNovelId(novelId);
    if (existing) {
      throw new Error('世界设定已存在');
    }

    return await WorldStateRepository.create(novelId, worldData);
  }

  /**
   * 更新世界设定
   */
  async updateWorldState(novelId, worldData) {
    const existing = await WorldStateRepository.findByNovelId(novelId);
    if (!existing) {
      // 如果不存在则创建
      return await WorldStateRepository.create(novelId, worldData);
    }

    return await WorldStateRepository.updateByNovelId(novelId, worldData);
  }

  /**
   * 更新规则
   */
  async updateRules(novelId, rules) {
    return await WorldStateRepository.updateRules(novelId, rules);
  }

  /**
   * 更新背景
   */
  async updateBackground(novelId, background) {
    return await WorldStateRepository.updateBackground(novelId, background);
  }

  /**
   * 更新境界体系
   */
  async updateRealmSystem(novelId, realmSystem) {
    return await WorldStateRepository.updateRealmSystem(novelId, realmSystem);
  }

  /**
   * 解析境界体系
   */
  parseRealmSystem(realmSystemStr) {
    try {
      if (typeof realmSystemStr === 'string') {
        return JSON.parse(realmSystemStr);
      }
      return realmSystemStr;
    } catch (error) {
      console.error('解析境界体系失败:', error);
      return {};
    }
  }

  /**
   * 验证境界升级是否合法
   */
  validateRealmUpgrade(currentRealm, newRealm, realmSystem) {
    if (!realmSystem || !realmSystem.levels) {
      return { isValid: true };
    }

    const levels = realmSystem.levels;
    const currentIndex = levels.indexOf(currentRealm);
    const newIndex = levels.indexOf(newRealm);

    if (currentIndex === -1 || newIndex === -1) {
      return {
        isValid: false,
        error: '境界不在体系中'
      };
    }

    // 境界只能升不能降
    if (newIndex < currentIndex) {
      return {
        isValid: false,
        error: `境界不能从「${currentRealm}」降低到「${newRealm}」`
      };
    }

    // 不能跨越太多境界
    if (newIndex - currentIndex > 1) {
      return {
        isValid: false,
        error: `境界不能从「${currentRealm}」直接跳到「${newRealm}」`
      };
    }

    return { isValid: true };
  }
}

export default new WorldStateService();
