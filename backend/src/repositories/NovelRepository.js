import { BaseRepository } from './BaseRepository.js';

/**
 * 小说Repository
 * 处理小说相关的数据库操作
 */
export class NovelRepository extends BaseRepository {
  constructor() {
    super('novel');
  }

  /**
   * 根据用户ID查询小说列表
   */
  async findByUserId(userId) {
    return this.findMany(
      { user_id: userId },
      '*',
      'created_at DESC'
    );
  }

  /**
   * 创建小说
   */
  async create(userId, title) {
    return this.insert({
      user_id: userId,
      title,
      created_at: new Date()
    });
  }

  /**
   * 更新小说标题
   */
  async updateTitle(novelId, title) {
    return this.update(
      { id: novelId },
      { title, updated_at: new Date() }
    );
  }

  /**
   * 删除小说（软删除）
   */
  async softDelete(novelId) {
    return this.update(
      { id: novelId },
      { deleted_at: new Date() }
    );
  }

  /**
   * 硬删除小说
   */
  async hardDelete(novelId) {
    return this.delete({ id: novelId });
  }

  /**
   * 检查小说是否属于用户
   */
  async isOwnedByUser(novelId, userId) {
    const novel = await this.findOne({ id: novelId, user_id: userId });
    return !!novel;
  }
}

export default new NovelRepository();
