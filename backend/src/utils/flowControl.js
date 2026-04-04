/**
 * 生成流程控制模块
 * 负责管理小说生成过程中的各个环节状态和约束
 */

export const FlowPhase = {
  INIT: 'init',
  QUERY_STATE: 'query_state',
  GENERATE_CONTENT: 'generate_content',
  EXTRACT_SUMMARY: 'extract_summary',
  VALIDATE_UPDATES: 'validate_updates',
  SAVE_CONTENT: 'save_content',
  UPDATE_STATE: 'update_state',
  COMMIT: 'commit',
  COMPLETE: 'complete',
  FAILED: 'failed'
};

export const FlowStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  RETRY: 'retry'
};

class GenerationFlow {
  constructor(novelId, userInput, wordCount) {
    this.novelId = novelId;
    this.userInput = userInput;
    this.wordCount = wordCount;
    this.startTime = Date.now();
    this.phases = {};
    this.errors = [];
    this.warnings = [];
    this.rollbackActions = [];
    this.metadata = {};

    this.initPhases();
  }

  initPhases() {
    const phases = [
      FlowPhase.INIT,
      FlowPhase.QUERY_STATE,
      FlowPhase.GENERATE_CONTENT,
      FlowPhase.EXTRACT_SUMMARY,
      FlowPhase.VALIDATE_UPDATES,
      FlowPhase.SAVE_CONTENT,
      FlowPhase.UPDATE_STATE,
      FlowPhase.COMMIT,
      FlowPhase.COMPLETE
    ];

    phases.forEach(phase => {
      this.phases[phase] = {
        status: FlowStatus.PENDING,
        startTime: null,
        endTime: null,
        duration: null,
        error: null,
        data: null
      };
    });
  }

  startPhase(phase) {
    if (!this.phases[phase]) {
      this.phases[phase] = {
        status: FlowStatus.PENDING,
        startTime: null,
        endTime: null,
        duration: null,
        error: null,
        data: null
      };
    }
    this.phases[phase].status = FlowStatus.RUNNING;
    this.phases[phase].startTime = Date.now();
    console.log(`[Flow] Phase ${phase} started`);
  }

  completePhase(phase, data = null) {
    if (!this.phases[phase]) return;
    this.phases[phase].status = FlowStatus.SUCCESS;
    this.phases[phase].endTime = Date.now();
    this.phases[phase].duration = this.phases[phase].endTime - this.phases[phase].startTime;
    this.phases[phase].data = data;
    console.log(`[Flow] Phase ${phase} completed in ${this.phases[phase].duration}ms`);
  }

  failPhase(phase, error) {
    if (!this.phases[phase]) return;
    this.phases[phase].status = FlowStatus.FAILED;
    this.phases[phase].endTime = Date.now();
    this.phases[phase].duration = this.phases[phase].endTime - this.phases[phase].startTime;
    this.phases[phase].error = error.message || String(error);
    this.errors.push({ phase, error: error.message || String(error) });
    console.error(`[Flow] Phase ${phase} failed: ${error}`);
  }

  skipPhase(phase, reason) {
    if (!this.phases[phase]) return;
    this.phases[phase].status = FlowStatus.SKIPPED;
    this.phases[phase].endTime = Date.now();
    this.warnings.push({ phase, reason });
    console.warn(`[Flow] Phase ${phase} skipped: ${reason}`);
  }

  addRollback(action) {
    this.rollbackActions.push(action);
  }

  async executeRollback() {
    console.log(`[Flow] Starting rollback of ${this.rollbackActions.length} actions`);
    for (const action of this.rollbackActions.reverse()) {
      try {
        await action();
      } catch (error) {
        console.error(`[Flow] Rollback action failed: ${error}`);
      }
    }
    this.rollbackActions = [];
  }

  getPhaseStatus(phase) {
    return this.phases[phase] || null;
  }

  getCurrentPhase() {
    for (const [phase, data] of Object.entries(this.phases)) {
      if (data.status === FlowStatus.RUNNING) {
        return phase;
      }
    }
    return null;
  }

  isComplete() {
    return this.phases[FlowPhase.COMPLETE]?.status === FlowStatus.SUCCESS ||
           this.phases[FlowPhase.FAILED]?.status === FlowStatus.FAILED;
  }

  hasFailed() {
    return Object.values(this.phases).some(p => p.status === FlowStatus.FAILED);
  }

  getSummary() {
    const totalDuration = Date.now() - this.startTime;
    const phaseSummary = {};

    for (const [phase, data] of Object.entries(this.phases)) {
      phaseSummary[phase] = {
        status: data.status,
        duration: data.duration,
        error: data.error
      };
    }

    return {
      novelId: this.novelId,
      userInput: this.userInput.substring(0, 50) + (this.userInput.length > 50 ? '...' : ''),
      wordCount: this.wordCount,
      totalDuration,
      phaseSummary,
      errors: this.errors,
      warnings: this.warnings,
      metadata: this.metadata
    };
  }
}

/**
 * 流程约束验证器
 * 在每个环节之间进行状态验证
 */
class FlowValidator {
  constructor(flow) {
    this.flow = flow;
    this.constraints = [];
    this.initDefaultConstraints();
  }

  initDefaultConstraints() {
    this.addConstraint('query_state', async (data) => {
      if (!data.worldState) {
        throw new Error('世界设定不能为空');
      }
      if (!data.characters || data.characters.length === 0) {
        throw new Error('至少需要一个角色');
      }
      return true;
    });

    this.addConstraint('validate_updates', async (data) => {
      // 更新合法性由 RuleEngine 统一判定，FlowValidator 仅做阶段级兜底检查
      if (!data || !data.validationResult) {
        throw new Error('缺少更新验证结果');
      }

      if (data.validationResult && Array.isArray(data.validationResult.appliedRules)) {
        return true;
      }
      throw new Error('验证未通过');
    });
  }

  addConstraint(phase, validator) {
    this.constraints.push({ phase, validator });
  }

  async validate(phase, data) {
    const relevantConstraints = this.constraints.filter(c => c.phase === phase);
    for (const constraint of relevantConstraints) {
      try {
        await constraint.validator(data);
      } catch (error) {
        this.flow.failPhase(phase, error);
        throw error;
      }
    }
    return true;
  }
}

/**
 * 内容审查器
 * 在生成内容后进行质量检查
 */
class ContentAuditor {
  constructor() {
    this.rules = [];
    this.initDefaultRules();
  }

  initDefaultRules() {
    this.addRule({
      name: 'min_length',
      description: '内容最小长度检查',
      check: (content, wordCount) => content.length >= wordCount * 0.8,
      message: '内容长度不足'
    });

    this.addRule({
      name: 'forbidden_patterns',
      description: '禁止模式检查',
      patterns: [
        { regex: /\[.*?\]/g, message: '包含JSON残留' },
        { regex: /^第\d+章\s*$/gm, message: '章节标记不完整' }
      ],
      check: (content) => {
        for (const pattern of this.rules[0]?.patterns || []) {
          if (pattern.regex.test(content)) {
            throw new Error(pattern.message);
          }
        }
        return true;
      }
    });
  }

  addRule(rule) {
    this.rules.push(rule);
  }

  async audit(content, metadata = {}) {
    const results = {
      passed: true,
      issues: []
    };

    for (const rule of this.rules) {
      try {
        const passed = await rule.check(content, metadata.wordCount);
        if (!passed) {
          results.passed = false;
          results.issues.push({
            rule: rule.name,
            message: rule.message || '检查未通过'
          });
        }
      } catch (error) {
        results.passed = false;
        results.issues.push({
          rule: rule.name,
          message: error.message
        });
      }
    }

    return results;
  }
}

/**
 * 规则引擎
 * 根据小说类型自动选择验证规则
 */
class RuleEngine {
  constructor() {
    this.ruleSets = this.defineRuleSets();
  }

  defineRuleSets() {
    return {
      // 通用规则（所有类型都适用）
      common: {
        name: '通用规则',
        description: '所有类型小说都适用的基本规则',
        rules: [
          {
            id: 'character_status',
            name: '角色状态规则',
            description: '死亡角色不能复活，状态变化必须合理',
            check: (content, characters, updates) => {
              const issues = [];
              for (const update of updates.character_updates || []) {
                const char = characters.find(c => c.name === update.name);
                if (!char) {
                  issues.push({ type: 'character_not_found', message: `角色${update.name}不存在` });
                  continue;
                }
                if (char.status === '死亡' && update.new_status !== '死亡') {
                  issues.push({ type: 'character_resurrection', message: `角色${update.name}已死亡，不能复活` });
                }
              }
              return { passed: issues.length === 0, issues };
            }
          },
          {
            id: 'item_status',
            name: '物品状态规则',
            description: '丢失/损毁的物品不能直接恢复',
            check: (content, characters, updates, items) => {
              const issues = [];
              for (const update of updates.item_updates || []) {
                if (update.is_new) continue;
                const item = items.find(i => i.name === update.name);
                if (!item) continue;
                if ((item.status === '丢失' || item.status === '损毁') && update.status === '存在') {
                  issues.push({ type: 'item_invalid_recovery', message: `物品${update.name}已${item.status}，不能恢复为存在` });
                }
              }
              return { passed: issues.length === 0, issues };
            }
          },
          {
            id: 'location_status',
            name: '地点状态规则',
            description: '毁灭的地点不能恢复',
            check: (content, characters, updates, items, locations) => {
              const issues = [];
              for (const update of updates.location_updates || []) {
                if (update.is_new) continue;
                const location = locations.find(l => l.name === update.name);
                if (!location) continue;
                if (location.status === '毁灭' && update.status !== '毁灭') {
                  issues.push({ type: 'location_invalid_recovery', message: `地点${update.name}已毁灭，不能恢复` });
                }
              }
              return { passed: issues.length === 0, issues };
            }
          }
        ]
      },

      // 玄幻/仙侠规则
      fantasy: {
        name: '玄幻/仙侠规则',
        description: '适用于修仙、玄幻类小说',
        hierarchy: {
          '凡人之躯': 0,
          '炼气期': 1,
          '筑基期': 2,
          '金丹期': 3,
          '元婴期': 4,
          '化神期': 5,
          '大乘期': 6,
          '渡劫期': 7,
          '真仙': 8,
          '金仙': 9,
          '太乙金仙': 10,
          '大罗金仙': 11,
          '混元大罗金仙': 12
        },
        rules: [
          {
            id: 'realm_combat',
            name: '境界压制规则',
            description: '战斗只能跨1-2个小境界，高境界碾压低境界',
            check: (content, characters, updates) => {
              const issues = [];
              const hierarchy = this.ruleSets.fantasy.hierarchy;

              const getRealmLevel = (realm) => hierarchy[realm] ?? -1;

              for (const update of updates.character_updates || []) {
                const char = characters.find(c => c.name === update.name);
                if (!char || !char.realm) continue;

                const currentLevel = getRealmLevel(char.realm);
                if (currentLevel < 0) continue;

                const mentions = (content.match(new RegExp(char.name, 'g')) || []).length;
                if (mentions > 0 && updates.combat_info) {
                  for (const combat of updates.combat_info) {
                    if (combat.winner === char.name && combat.loser) {
                      const loser = characters.find(c => c.name === combat.loser);
                      if (loser && loser.realm) {
                        const loserLevel = getRealmLevel(loser.realm);
                        const diff = currentLevel - loserLevel;
                        if (diff < 1) {
                          issues.push({
                            type: 'realm_violation',
                            message: `${char.name}(${char.realm})战胜${loser.name}(${loser.realm})不符合境界压制规则`
                          });
                        }
                      }
                    }
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          },
          {
            id: 'immortal_rule',
            name: '修仙者规则',
            description: '修士不能对凡人出手（除非特殊设定）',
            check: (content, characters, updates) => {
              const issues = [];
              const hierarchy = this.ruleSets.fantasy.hierarchy;
              const mortalName = '凡人之躯';

              for (const char of characters) {
                if (char.realm && hierarchy[char.realm] > 1) {
                  const mortalMentions = (content.match(/凡?人/g) || []).length;
                  if (mortalMentions > 5) {
                    issues.push({
                      type: 'mortal_encounter',
                      message: `高阶修士${char.name}频繁接触凡人，可能违反修仙界规则`
                    });
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          }
        ]
      },

      // 都市规则
      urban: {
        name: '都市规则',
        description: '适用于现代都市类小说',
        rules: [
          {
            id: 'money_rule',
            name: '财富等级规则',
            description: '财富值变化必须合理（不能从0突然买别墅）',
            check: (content, characters, updates) => {
              const issues = [];
              for (const update of updates.character_updates || []) {
                const char = characters.find(c => c.name === update.name);
                if (!char) continue;

                if (char.wealth !== undefined && update.wealth !== undefined) {
                  const wealthDiff = update.wealth - char.wealth;
                  if (wealthDiff > 10000000 && !content.includes('彩票') && !content.includes('继承')) {
                    issues.push({
                      type: 'wealth_impossible',
                      message: `角色${char.name}财富值增长不合理（+${wealthDiff}），缺少合理来源`
                    });
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          },
          {
            id: 'social_status',
            name: '社会地位规则',
            description: '地位提升需要合理的事件驱动',
            check: (content, characters, updates) => {
              const issues = [];
              const statusLevels = { '底层': 1, '普通': 2, '中产': 3, '上层': 4, '顶尖': 5 };

              for (const update of updates.character_updates || []) {
                const char = characters.find(c => c.name === update.name);
                if (!char || !char.social_status) continue;

                const currentLevel = statusLevels[char.social_status] || 2;
                const newLevel = statusLevels[update.social_status] || 2;
                const diff = newLevel - currentLevel;

                if (diff > 1 && !content.includes('家族') && !content.includes('继承') && !content.includes('结婚')) {
                  issues.push({
                    type: 'social_status_impossible',
                    message: `角色${char.name}社会地位提升过快，缺少合理事件驱动`
                  });
                }
              }
              return { passed: issues.length === 0, issues };
            }
          }
        ]
      },

      // 游戏规则
      gaming: {
        name: '游戏规则',
        description: '适用于游戏类/网游类小说',
        rules: [
          {
            id: 'level_rule',
            name: '等级压制规则',
            description: '游戏等级差距过大时战斗结果确定',
            check: (content, characters, updates) => {
              const issues = [];
              const hierarchy = { '新手': 0, '初级': 1, '中级': 2, '高级': 3, '专家': 4, '大师': 5, '王者': 6 };

              for (const update of updates.character_updates || []) {
                const char = characters.find(c => c.name === update.name);
                if (!char || !char.game_level) continue;

                const myLevel = hierarchy[char.game_level] ?? 0;
                if (updates.combat_info) {
                  for (const combat of updates.combat_info) {
                    if (combat.winner === char.name && combat.loser) {
                      const loser = characters.find(c => c.name === combat.loser);
                      if (loser && loser.game_level) {
                        const loserLevel = hierarchy[loser.game_level] ?? 0;
                        if (myLevel - loserLevel < 2 && myLevel > 0) {
                          issues.push({
                            type: 'level_difference_insufficient',
                            message: `游戏等级差距不足：${char.name}(${char.game_level}) vs ${loser.name}(${loser.game_level})`
                          });
                        }
                      }
                    }
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          },
          {
            id: 'equipment_rule',
            name: '装备等级规则',
            description: '装备有等级要求，不满足则无法使用',
            check: (content, characters, updates, items) => {
              const issues = [];
              const levelItems = items.filter(i => i.required_level);

              for (const char of characters) {
                const charLevel = hierarchy?.[char.realm] || 1;
                const ownedItems = levelItems.filter(i => i.owner === char.name);

                for (const item of ownedItems) {
                  if (item.required_level > charLevel) {
                    issues.push({
                      type: 'equipment_level_insufficient',
                      message: `角色${char.name}等级(${charLevel})不足以使用${item.name}(需要${item.required_level}级)`
                    });
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          }
        ]
      },

      // 科幻规则
      scifi: {
        name: '科幻规则',
        description: '适用于科幻类小说',
        rules: [
          {
            id: 'tech_level',
            name: '科技等级规则',
            description: '科技产品不能跨越太多等级',
            check: (content, characters, updates) => {
              const issues = [];
              const techLevels = { '原始': 0, '古代': 1, '近代': 2, '现代': 3, '近未来': 4, '未来': 5, '星际': 6 };

              for (const item of updates.item_updates || []) {
                if (item.type === '科技产品' && item.tech_level !== undefined) {
                  if (item.tech_level > 5 && !content.includes('外星') && !content.includes('未来')) {
                    issues.push({
                      type: 'tech_level_impossible',
                      message: `高科技产品${item.name}出现过于突兀，缺少技术来源说明`
                    });
                  }
                }
              }
              return { passed: issues.length === 0, issues };
            }
          }
        ]
      }
    };
  }

  getRulesForGenre(genre) {
    const genreLower = (genre || '').toLowerCase();
    const rules = [];

    rules.push(...this.ruleSets.common.rules);

    if (genreLower.includes('玄幻') || genreLower.includes('仙侠') || genreLower.includes('修真')) {
      rules.push(...this.ruleSets.fantasy.rules);
    } else if (genreLower.includes('都市') || genreLower.includes('现代')) {
      rules.push(...this.ruleSets.urban.rules);
    } else if (genreLower.includes('游戏') || genreLower.includes('网游') || genreLower.includes('虚拟现实')) {
      rules.push(...this.ruleSets.gaming.rules);
    } else if (genreLower.includes('科幻') || genreLower.includes('星际') || genreLower.includes('未来')) {
      rules.push(...this.ruleSets.scifi.rules);
    }

    return rules;
  }

  validate(content, characters, updates, items, locations, genre) {
    const rules = this.getRulesForGenre(genre);
    const allIssues = [];
    const appliedRules = [];

    for (const rule of rules) {
      try {
        const result = rule.check(content, characters, updates, items, locations);
        if (!result.passed) {
          allIssues.push(...result.issues.map(i => ({ ...i, rule_id: rule.id, rule_name: rule.name })));
        }
        appliedRules.push({ id: rule.id, name: rule.name, passed: result.passed });
      } catch (error) {
        console.error(`[RuleEngine] Rule ${rule.id} failed:`, error);
      }
    }

    return {
      passed: allIssues.length === 0,
      issues: allIssues,
      appliedRules,
      genre,
      ruleCount: rules.length
    };
  }
}

/**
 * 境界压制验证器（保留兼容性）
 * @deprecated 使用 RuleEngine 替代
 */
class RealmValidator {
  constructor() {
    this.realmHierarchy = {
      '凡人之躯': 0,
      '炼气期': 1,
      '筑基期': 2,
      '金丹期': 3,
      '元婴期': 4,
      '化神期': 5,
      '大乘期': 6,
      '渡劫期': 7,
      '真仙': 8,
      '金仙': 9,
      '太乙金仙': 10,
      '大罗金仙': 11,
      '混元大罗金仙': 12
    };
  }

  getRealmLevel(realm) {
    return this.realmHierarchy[realm] ?? -1;
  }

  isValidRealm(realm) {
    return realm in this.realmHierarchy;
  }

  canBeat(realm1, realm2) {
    const level1 = this.getRealmLevel(realm1);
    const level2 = this.getRealmLevel(realm2);
    if (level1 < 0 || level2 < 0) return true;
    return (level1 - level2) >= 1;
  }

  validateCombat(characters, combatInfo) {
    const issues = [];
    for (const combat of combatInfo || []) {
      const winner = characters.find(c => c.name === combat.winner);
      const loser = characters.find(c => c.name === combat.loser);
      if (winner && loser && winner.realm && loser.realm) {
        if (!this.canBeat(winner.realm, loser.realm)) {
          issues.push({
            type: 'realm_violation',
            message: `境界压制：${winner.name}(${winner.realm})不应战胜${loser.name}(${loser.realm})`
          });
        }
      }
    }
    return { passed: issues.length === 0, issues };
  }
}

/**
 * 一致性检查器
 * 验证前后文的连贯性
 */
class ConsistencyChecker {
  constructor() {
    this.history = [];
    this.maxHistory = 10;
  }

  addToHistory(entry) {
    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  getLastContent(chapterCount = 3) {
    return this.history.slice(-chapterCount);
  }

  checkConsistency(currentContent, currentUpdates, characters, items, locations) {
    const issues = [];

    const recentContent = this.getLastContent(3);

    for (const update of currentUpdates.character_updates || []) {
      const char = characters.find(c => c.name === update.name);
      if (!char) continue;

      for (const past of recentContent) {
        if (past.character_updates) {
          const pastUpdate = past.character_updates.find(u => u.name === update.name);
          if (pastUpdate) {
            if (pastUpdate.new_status === '死亡' && update.new_status !== '死亡') {
              issues.push({
                type: 'character_resurrection',
                message: `角色${update.name}已被设定为死亡，不能复活`
              });
            }
          }
        }
      }
    }

    for (const update of currentUpdates.item_updates || []) {
      const item = items.find(i => i.name === update.name);
      if (!item) continue;

      if (item.status === '丢失' || item.status === '损毁') {
        if (update.status === '存在') {
          issues.push({
            type: 'item_invalid_recovery',
            message: `物品${update.name}已丢失/损毁，不能恢复为存在`
          });
        }
      }
    }

    for (const update of currentUpdates.location_updates || []) {
      const location = locations.find(l => l.name === update.name);
      if (!location) continue;

      if (location.status === '毁灭') {
        if (update.status !== '毁灭') {
          issues.push({
            type: 'location_invalid_recovery',
            message: `地点${update.name}已毁灭，不能恢复`
          });
        }
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
}

/**
 * 验证规则引擎
 * 集中管理所有验证规则
 */
class ValidationEngine {
  constructor() {
    this.characterNames = new Set();
    this.characterStatusMap = {};
    this.itemNames = new Set();
    this.itemStatusMap = {};
    this.itemOwnerMap = {};
    this.locationNames = new Set();
    this.locationStatusMap = {};
    this.minorCharacterNames = new Set();
    this.realmValidator = new RealmValidator();
    this.consistencyChecker = new ConsistencyChecker();
    this.worldState = null;
  }

  initialize(characters, items, locations, minorCharacters, worldState) {
    this.characterNames = new Set(characters.map(c => c.name));
    this.characterStatusMap = {};
    characters.forEach(c => { this.characterStatusMap[c.name] = c.status; });

    this.itemNames = new Set(items.map(i => i.name));
    this.itemStatusMap = {};
    this.itemOwnerMap = {};
    items.forEach(i => {
      this.itemStatusMap[i.name] = i.status;
      this.itemOwnerMap[i.name] = i.owner || '无主';
    });

    this.locationNames = new Set(locations.map(l => l.name));
    this.locationStatusMap = {};
    locations.forEach(l => { this.locationStatusMap[l.name] = l.status; });

    this.minorCharacterNames = new Set(minorCharacters.map(m => m.name));
    this.worldState = worldState;
  }

  validateCharacterUpdate(update) {
    const warnings = [];
    const errors = [];

    if (!update.name || !this.characterNames.has(update.name)) {
      errors.push(`跳过无效角色更新: ${update.name} - 角色不存在`);
      return { valid: false, errors, warnings };
    }

    const currentStatus = this.characterStatusMap[update.name];
    const newStatus = update.new_status;

    if (currentStatus === '死亡') {
      if (newStatus !== '死亡') {
        errors.push(`跳过非法状态变更: ${update.name} 从死亡变为${newStatus} - 死亡不可逆`);
        return { valid: false, errors, warnings };
      }
    }

    if (currentStatus === '正常' && newStatus === '死亡') {
      warnings.push(`角色 ${update.name} 将从正常变为死亡`);
    } else if (currentStatus === '受伤' && newStatus === '正常') {
      warnings.push(`角色 ${update.name} 将从受伤恢复为正常`);
    }

    return { valid: true, errors, warnings };
  }

  validateItemUpdate(update) {
    const warnings = [];
    const errors = [];

    if (!update.name) {
      errors.push('物品名称为空');
      return { valid: false, errors, warnings };
    }

    // 兼容处理：is_new 可以是布尔值 true 或字符串 "true"
    const isNewItem = update.is_new === true || update.is_new === 'true' || update.is_new === 1;

    if (!isNewItem && !this.itemNames.has(update.name)) {
      errors.push(`跳过未知的物品更新: ${update.name}`);
      return { valid: false, errors, warnings };
    }

    if (!isNewItem) {
      const currentStatus = this.itemStatusMap[update.name];
      if (currentStatus === '丢失' && update.status === '存在') {
        errors.push(`跳过非法物品状态变更: ${update.name} 从丢失变为存在`);
        return { valid: false, errors, warnings };
      }
      if (currentStatus === '损毁' && update.status === '存在') {
        errors.push(`跳过非法物品状态变更: ${update.name} 从损毁变为存在`);
        return { valid: false, errors, warnings };
      }
    }

    return { valid: true, errors, warnings };
  }

  validateLocationUpdate(update) {
    const warnings = [];
    const errors = [];

    if (!update.name) {
      errors.push('地点名称为空');
      return { valid: false, errors, warnings };
    }

    // 兼容处理：is_new 可以是布尔值 true 或字符串 "true"
    const isNewLocation = update.is_new === true || update.is_new === 'true' || update.is_new === 1;

    if (!isNewLocation && !this.locationNames.has(update.name)) {
      errors.push(`跳过未知的地点更新: ${update.name}`);
      return { valid: false, errors, warnings };
    }

    if (!isNewLocation) {
      const currentStatus = this.locationStatusMap[update.name];
      if (currentStatus === '毁灭' && update.status !== '毁灭') {
        errors.push(`跳过非法地点状态变更: ${update.name} 从毁灭恢复`);
        return { valid: false, errors, warnings };
      }
    }

    return { valid: true, errors, warnings };
  }

  validateMinorCharacterUpdate(update) {
    const warnings = [];
    const errors = [];

    if (!update.name) {
      errors.push('配角名称为空');
      return { valid: false, errors, warnings };
    }

    if (update.is_new === true) {
      if (!update.role) {
        warnings.push(`新配角 ${update.name} 未指定角色类型`);
      }
      if (!update.status) {
        update.status = '正常';
      }
    } else if (!this.minorCharacterNames.has(update.name)) {
      errors.push(`跳过未知的配角更新: ${update.name}`);
      return { valid: false, errors, warnings };
    }

    return { valid: true, errors, warnings };
  }

  validateRealmCombat(characters, content) {
    if (!this.worldState?.realm_system?.has_realm) {
      return { passed: true, issues: [] };
    }

    const issues = [];
    const realmSystem = this.worldState.realm_system;

    return this.realmValidator.validateCombat(content, characters, realmSystem);
  }

  validateAllUpdates(updates, content, characters) {
    const allWarnings = [];
    const allErrors = [];
    const validUpdates = {
      character_updates: [],
      minor_character_updates: [],
      item_updates: [],
      location_updates: [],
      world_updates: updates.world_updates || {},
      summary: updates.summary || '',
      chapter_title: updates.chapter_title || '',
      chapter_outline: updates.chapter_outline || ''
    };

    if (updates.character_updates && Array.isArray(updates.character_updates)) {
      for (const update of updates.character_updates) {
        const result = this.validateCharacterUpdate(update);
        if (result.valid) {
          validUpdates.character_updates.push(update);
          allWarnings.push(...result.warnings.map(w => ({ type: 'character', ...w })));
        } else {
          allErrors.push(...result.errors.map(e => ({ type: 'character', message: e })));
        }
      }
    }

    if (updates.minor_character_updates && Array.isArray(updates.minor_character_updates)) {
      for (const update of updates.minor_character_updates) {
        const result = this.validateMinorCharacterUpdate(update);
        if (result.valid) {
          validUpdates.minor_character_updates.push(update);
          allWarnings.push(...result.warnings.map(w => ({ type: 'minor_character', ...w })));
        } else {
          allErrors.push(...result.errors.map(e => ({ type: 'minor_character', message: e })));
        }
      }
    }

    if (updates.item_updates && Array.isArray(updates.item_updates)) {
      for (const update of updates.item_updates) {
        const result = this.validateItemUpdate(update);
        if (result.valid) {
          validUpdates.item_updates.push(update);
          allWarnings.push(...result.warnings.map(w => ({ type: 'item', ...w })));
        } else {
          allErrors.push(...result.errors.map(e => ({ type: 'item', message: e })));
        }
      }
    }

    if (updates.location_updates && Array.isArray(updates.location_updates)) {
      for (const update of updates.location_updates) {
        const result = this.validateLocationUpdate(update);
        if (result.valid) {
          validUpdates.location_updates.push(update);
          allWarnings.push(...result.warnings.map(w => ({ type: 'location', ...w })));
        } else {
          allErrors.push(...result.errors.map(e => ({ type: 'location', message: e })));
        }
      }
    }

    const realmResult = this.validateRealmCombat(characters, content);
    if (!realmResult.passed) {
      allWarnings.push(...realmResult.issues.map(i => ({ type: 'realm', ...i })));
    }

    const consistencyResult = this.consistencyChecker.checkConsistency(
      content,
      updates,
      characters,
      [],
      []
    );
    if (!consistencyResult.passed) {
      allErrors.push(...consistencyResult.issues.map(i => ({ type: 'consistency', ...i })));
    }

    console.log('[ValidationEngine] 验证结果:', {
      validUpdates: validUpdates,
      errors: allErrors,
      warnings: allWarnings
    });

    return {
      validUpdates,
      errors: allErrors,
      warnings: allWarnings,
      passed: allErrors.length === 0
    };
  }
}

export { GenerationFlow, FlowValidator, ContentAuditor, RealmValidator, ConsistencyChecker, ValidationEngine, RuleEngine };
export default {
  GenerationFlow,
  FlowValidator,
  ContentAuditor,
  RealmValidator,
  ConsistencyChecker,
  ValidationEngine,
  RuleEngine,
  FlowPhase,
  FlowStatus
};
