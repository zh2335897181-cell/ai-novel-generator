import { BaseRepository } from './BaseRepository.js';

/**
 * 内容Repository
 * 处理小说内容相关的数据库操作
 */
export class ContentRepository extends BaseRepository {
  constructor() {
    super('story_content');
  }

  /**
   * 根据小说ID查询所有内容
   */
  async findByNovelId(novelId) {
    return this.findMany(
      { novel_id: novelId },
      '*',
      'chapter_number ASC, created_at ASC'
    );
  }

  /**
   * 创建内容
   */
  async create(novelId, contentData) {
    return this.insert({
      novel_id: novelId,
      content: contentData.content,
      chapter_number: contentData.chapter_number,
      chapter_title: contentData.chapter_title || null,
      chapter_outline: contentData.chapter_outline || null,
      word_count: contentData.word_count || 0,
      created_at: new Date()
    });
  }

  /**
   * 获取最大章节号
   */
  async getMaxChapterNumber(novelId) {
    const sql = `SELECT MAX(chapter_number) as max_chapter FROM ${this.tableName} WHERE novel_id = ?`;
    const rows = await this.query(sql, [novelId]);
    return rows[0]?.max_chapter || 0;
  }

  /**
   * 根据章节号查询内容
   */
  async findByChapterNumber(novelId, chapterNumber) {
    return this.findOne({
      novel_id: novelId,
      chapter_number: chapterNumber
    });
  }

  /**
   * 更新内容
   */
  async updateContent(novelId, chapterNumber, content) {
    return this.update(
      { novel_id: novelId, chapter_number: chapterNumber },
      { content, updated_at: new Date() }
    );
  }

  /**
   * 删除章节
   */
  async deleteChapter(novelId, chapterNumber) {
    return this.delete({
      novel_id: novelId,
      chapter_number: chapterNumber
    });
  }

  /**
   * 统计总字数
   */
  async getTotalWordCount(novelId) {
    const sql = `SELECT SUM(word_count) as total FROM ${this.tableName} WHERE novel_id = ?`;
    const rows = await this.query(sql, [novelId]);
    return rows[0]?.total || 0;
  }

  /**
   * 统计章节数
   */
  async countChapters(novelId) {
    return this.count({ novel_id: novelId });
  }

  /**
   * 获取最近N章
   */
  async getRecentChapters(novelId, limit = 10) {
    return this.findMany(
      { novel_id: novelId },
      '*',
      'chapter_number DESC',
      limit
    );
  }
}

export default new ContentRepository();
