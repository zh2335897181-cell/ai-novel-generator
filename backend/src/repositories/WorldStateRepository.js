import { BaseRepository } from './BaseRepository.js';

/**
 * 世界设定Repository
 * 处理世界设定相关的数据库操作
 */
export class WorldStateRepository extends BaseRepository {
  constructor() {
    super('world_state');
  }

  /**
   * 根据小说ID查询世界设定
   */
  async findByNovelId(novelId) {
    return this.findOne({ novel_id: novelId });
  }

  /**
   * 创建世界设定
   */
  async create(novelId, worldData = {}) {
    return this.insert({
      novel_id: novelId,
      genre: worldData.genre || '',
      style: worldData.style || '',
      rules: worldData.rules || '',
      background: worldData.background || '',
      realm_system: worldData.realm_system || '{}',
      extra: worldData.extra || '{}',
      created_at: new Date()
    });
  }

  /**
   * 更新世界设定
   */
  async updateByNovelId(novelId, worldData) {
    const updateData = { updated_at: new Date() };
    
    if (worldData.genre !== undefined) updateData.genre = worldData.genre;
    if (worldData.style !== undefined) updateData.style = worldData.style;
    if (worldData.rules !== undefined) updateData.rules = worldData.rules;
    if (worldData.background !== undefined) updateData.background = worldData.background;
    if (worldData.realm_system !== undefined) {
      updateData.realm_system = typeof worldData.realm_system === 'string'
        ? worldData.realm_system
        : JSON.stringify(worldData.realm_system);
    }
    if (worldData.extra !== undefined) {
      updateData.extra = typeof worldData.extra === 'string'
        ? worldData.extra
        : JSON.stringify(worldData.extra);
    }

    return this.update({ novel_id: novelId }, updateData);
  }

  /**
   * 更新规则
   */
  async updateRules(novelId, rules) {
    return this.update(
      { novel_id: novelId },
      { rules, updated_at: new Date() }
    );
  }

  /**
   * 更新背景
   */
  async updateBackground(novelId, background) {
    return this.update(
      { novel_id: novelId },
      { background, updated_at: new Date() }
    );
  }

  /**
   * 更新境界体系
   */
  async updateRealmSystem(novelId, realmSystem) {
    const realmSystemStr = typeof realmSystem === 'string'
      ? realmSystem
      : JSON.stringify(realmSystem);
    
    return this.update(
      { novel_id: novelId },
      { realm_system: realmSystemStr, updated_at: new Date() }
    );
  }
}

export default new WorldStateRepository();
