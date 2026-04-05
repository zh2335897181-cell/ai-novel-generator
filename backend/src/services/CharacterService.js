import CharacterRepository from '../repositories/CharacterRepository.js';

/**
 * 角色Service
 * 处理角色相关的业务逻辑
 */
export class CharacterService {
  /**
   * 获取小说的所有角色
   */
  async getCharactersByNovelId(novelId) {
    return await CharacterRepository.findByNovelId(novelId);
  }

  /**
   * 根据名称获取角色
   */
  async getCharacterByName(novelId, name) {
    return await CharacterRepository.findByName(novelId, name);
  }

  /**
   * 创建角色
   */
  async createCharacter(novelId, characterData) {
    // 验证角色名称唯一性
    const existing = await CharacterRepository.findByName(novelId, characterData.name);
    if (existing) {
      throw new Error(`角色「${characterData.name}」已存在`);
    }

    return await CharacterRepository.create(novelId, characterData);
  }

  /**
   * 更新角色状态
   */
  async updateCharacterStatus(novelId, name, status) {
    const character = await CharacterRepository.findByName(novelId, name);
    if (!character) {
      throw new Error(`角色「${name}」不存在`);
    }

    // 防止角色复活
    if (character.status === '死亡' && status !== '死亡') {
      throw new Error(`角色「${name}」已死亡，无法复活`);
    }

    return await CharacterRepository.updateStatus(novelId, name, status);
  }

  /**
   * 更新角色等级
   */
  async updateCharacterLevel(novelId, name, level) {
    const character = await CharacterRepository.findByName(novelId, name);
    if (!character) {
      throw new Error(`角色「${name}」不存在`);
    }

    // 等级只能增加不能减少
    if (level < character.level) {
      throw new Error(`角色「${name}」等级不能降低`);
    }

    return await CharacterRepository.updateLevel(novelId, name, level);
  }

  /**
   * 批量更新角色
   */
  async batchUpdateCharacters(novelId, updates) {
    // 验证所有更新
    for (const update of updates) {
      const character = await CharacterRepository.findByName(novelId, update.name);
      if (!character) {
        console.warn(`角色「${update.name}」不存在，跳过更新`);
        continue;
      }

      // 防止角色复活
      if (character.status === '死亡' && update.status && update.status !== '死亡') {
        console.warn(`角色「${update.name}」已死亡，跳过状态更新`);
        update.status = '死亡';
      }

      // 等级只能增加
      if (update.level && update.level < character.level) {
        console.warn(`角色「${update.name}」等级不能降低，跳过等级更新`);
        delete update.level;
      }
    }

    return await CharacterRepository.batchUpdate(novelId, updates);
  }

  /**
   * 获取死亡角色列表
   */
  async getDeadCharacters(novelId) {
    return await CharacterRepository.findDeadCharacters(novelId);
  }

  /**
   * 统计角色数量
   */
  async countCharacters(novelId) {
    return await CharacterRepository.countByNovelId(novelId);
  }

  /**
   * 验证角色更新的合法性
   */
  validateCharacterUpdate(currentCharacter, update) {
    const errors = [];

    // 检查角色复活
    if (currentCharacter.status === '死亡' && update.status && update.status !== '死亡') {
      errors.push({
        type: 'character_resurrection',
        message: `角色「${currentCharacter.name}」已死亡，不能复活`
      });
    }

    // 检查等级降低
    if (update.level && update.level < currentCharacter.level) {
      errors.push({
        type: 'level_decrease',
        message: `角色「${currentCharacter.name}」等级不能从${currentCharacter.level}降低到${update.level}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new CharacterService();
