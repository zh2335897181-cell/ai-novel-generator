import { BaseRepository } from './BaseRepository.js';

/**
 * 角色Repository
 * 处理角色相关的数据库操作
 */
export class CharacterRepository extends BaseRepository {
  constructor() {
    super('character_state');
  }

  /**
   * 根据小说ID查询所有角色
   */
  async findByNovelId(novelId) {
    return this.findMany(
      { novel_id: novelId },
      '*',
      'created_at ASC'
    );
  }

  /**
   * 根据名称查询角色
   */
  async findByName(novelId, name) {
    return this.findOne({
      novel_id: novelId,
      name
    });
  }

  /**
   * 创建角色
   */
  async create(novelId, characterData) {
    return this.insert({
      novel_id: novelId,
      name: characterData.name,
      level: characterData.level || 1,
      realm: characterData.realm || null,
      status: characterData.status || '正常',
      attributes: typeof characterData.attributes === 'string'
        ? characterData.attributes
        : JSON.stringify(characterData.attributes || {}),
      created_at: new Date()
    });
  }

  /**
   * 更新角色状态
   */
  async updateStatus(novelId, name, status) {
    return this.update(
      { novel_id: novelId, name },
      { status, updated_at: new Date() }
    );
  }

  /**
   * 更新角色等级
   */
  async updateLevel(novelId, name, level) {
    return this.update(
      { novel_id: novelId, name },
      { level, updated_at: new Date() }
    );
  }

  /**
   * 更新角色境界
   */
  async updateRealm(novelId, name, realm) {
    return this.update(
      { novel_id: novelId, name },
      { realm, updated_at: new Date() }
    );
  }

  /**
   * 批量更新角色
   */
  async batchUpdate(novelId, updates) {
    const conn = await this.beginTransaction();
    try {
      for (const update of updates) {
        const updateData = {};
        if (update.status) updateData.status = update.status;
        if (update.level) updateData.level = update.level;
        if (update.realm) updateData.realm = update.realm;
        if (update.attributes) {
          updateData.attributes = typeof update.attributes === 'string'
            ? update.attributes
            : JSON.stringify(update.attributes);
        }
        updateData.updated_at = new Date();

        await conn.query(
          `UPDATE ${this.tableName} SET ? WHERE novel_id = ? AND name = ?`,
          [updateData, novelId, update.name]
        );
      }
      await this.commit(conn);
      return true;
    } catch (error) {
      await this.rollback(conn);
      throw error;
    }
  }

  /**
   * 查询死亡角色
   */
  async findDeadCharacters(novelId) {
    return this.findMany(
      { novel_id: novelId, status: '死亡' },
      '*',
      'updated_at DESC'
    );
  }

  /**
   * 统计角色数量
   */
  async countByNovelId(novelId) {
    return this.count({ novel_id: novelId });
  }
}

export default new CharacterRepository();
