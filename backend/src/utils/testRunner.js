/**
 * 测试用例库
 * 用于AI小说生成系统的自动化测试
 */

import pool from '../config/database.js';
import { ValidationEngine, ConsistencyChecker, RealmValidator } from './flowControl.js';
import aiClient from './aiClient.js';
import aiFunctionClient from './functionCalling.js';

class TestCase {
  constructor(data) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.category = data.category || 'general';
    this.input = data.input || {};
    this.expected = data.expected || {};
    this.actual = null;
    this.passed = null;
    this.error = null;
    this.duration = null;
  }

  async run() {
    const startTime = Date.now();
    try {
      this.actual = await this.execute();
      this.passed = this.evaluate();
      this.error = null;
    } catch (error) {
      this.passed = false;
      this.error = error.message;
      this.actual = null;
    }
    this.duration = Date.now() - startTime;
    return this;
  }

  async execute() {
    throw new Error('TestCase.execute() must be implemented');
  }

  evaluate() {
    return true;
  }
}

class ValidationTestCase extends TestCase {
  async execute() {
    const engine = new ValidationEngine();
    engine.initialize(
      this.input.characters || [],
      this.input.items || [],
      this.input.locations || [],
      this.input.minorCharacters || [],
      this.input.worldState
    );

    return engine.validateAllUpdates(
      this.input.updates,
      this.input.content || '',
      this.input.characters || []
    );
  }

  evaluate() {
    if (!this.actual) return false;

    if (this.expected.shouldPass) {
      return this.actual.passed === true;
    }

    if (this.expected.errors) {
      if (!this.actual.errors || this.actual.errors.length === 0) {
        return false;
      }
      for (const expectedError of this.expected.errors) {
        const found = this.actual.errors.find(
          e => e.type === expectedError.type && e.message.includes(expectedError.pattern)
        );
        if (!found) return false;
      }
      return true;
    }

    return this.actual.passed;
  }
}

class ConsistencyTestCase extends TestCase {
  async execute() {
    const checker = new ConsistencyChecker();
    if (this.input.history) {
      for (const entry of this.input.history) {
        checker.addToHistory(entry);
      }
    }

    return checker.checkConsistency(
      this.input.currentContent,
      this.input.currentUpdates,
      this.input.characters,
      this.input.items,
      this.input.locations
    );
  }

  evaluate() {
    if (!this.actual) return false;

    if (this.expected.shouldPass) {
      return this.actual.passed === true;
    }

    if (this.expected.issues) {
      if (!this.actual.issues || this.actual.issues.length === 0) {
        return false;
      }
      for (const expectedIssue of this.expected.issues) {
        const found = this.actual.issues.find(
          i => i.type === expectedIssue.type
        );
        if (!found) return false;
      }
      return true;
    }

    return this.actual.passed;
  }
}

class RealmTestCase extends TestCase {
  async execute() {
    const validator = new RealmValidator();
    const realmSystem = this.input.realmSystem || {};

    return validator.validateCombat(
      this.input.content,
      this.input.characters,
      realmSystem
    );
  }

  evaluate() {
    if (!this.actual) return false;
    return this.actual.passed === true;
  }
}

class TestSuite {
  constructor(name) {
    this.name = name;
    this.testCases = [];
    this.results = [];
  }

  addTest(testCase) {
    this.testCases.push(testCase);
  }

  async runAll() {
    this.results = [];
    for (const testCase of this.testCases) {
      const result = await testCase.run();
      this.results.push(result);
    }
    return this;
  }

  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    return {
      name: this.name,
      total,
      passed,
      failed,
      passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : '0%',
      duration: this.results.reduce((sum, r) => sum + (r.duration || 0), 0),
      failedTests: this.results.filter(r => !r.passed)
    };
  }
}

const TestCases = {
  characterStatusValidation: [
    {
      id: 'CSV-001',
      name: '死亡角色不能复活',
      description: '验证死亡状态的角色不能被更新为存活状态',
      input: {
        characters: [
          { name: '张三', status: '死亡', level: 10 },
          { name: '李四', status: '正常', level: 8 }
        ],
        items: [],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          character_updates: [
            { name: '张三', new_status: '正常', level: 10 }
          ]
        }
      },
      expected: {
        errors: [
          { type: 'character', pattern: '死亡不可逆' }
        ]
      }
    },
    {
      id: 'CSV-002',
      name: '正常角色可以受伤或死亡',
      description: '验证正常状态的角色可以变为受伤或死亡',
      input: {
        characters: [
          { name: '张三', status: '正常', level: 10 }
        ],
        items: [],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          character_updates: [
            { name: '张三', new_status: '死亡', level: 10 }
          ]
        }
      },
      expected: {
        shouldPass: true
      }
    },
    {
      id: 'CSV-003',
      name: '不存在的角色不能更新',
      description: '验证只能更新数据库中存在的角色',
      input: {
        characters: [
          { name: '张三', status: '正常', level: 10 }
        ],
        items: [],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          character_updates: [
            { name: '不存在的角色', new_status: '正常', level: 1 }
          ]
        }
      },
      expected: {
        errors: [
          { type: 'character', pattern: '角色不存在' }
        ]
      }
    },
    {
      id: 'CSV-004',
      name: '受伤角色可以恢复或死亡',
      description: '验证受伤状态的角色可以变为正常或死亡',
      input: {
        characters: [
          { name: '张三', status: '受伤', level: 10 }
        ],
        items: [],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          character_updates: [
            { name: '张三', new_status: '正常', level: 10 }
          ]
        }
      },
      expected: {
        shouldPass: true
      }
    }
  ],

  itemStatusValidation: [
    {
      id: 'ISV-001',
      name: '丢失物品不能恢复',
      description: '验证丢失状态的物品不能被更新为存在',
      input: {
        characters: [],
        items: [
          { name: '玄铁剑', status: '丢失', owner: '张三' }
        ],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          item_updates: [
            { name: '玄铁剑', type: '武器', owner: '张三', status: '存在', is_new: false }
          ]
        }
      },
      expected: {
        errors: [
          { type: 'item', pattern: '丢失' }
        ]
      }
    },
    {
      id: 'ISV-002',
      name: '损毁物品不能恢复',
      description: '验证损毁状态的物品不能被更新为存在',
      input: {
        characters: [],
        items: [
          { name: '紫金葫芦', status: '损毁', owner: '张三' }
        ],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          item_updates: [
            { name: '紫金葫芦', type: '宝物', owner: '张三', status: '存在', is_new: false }
          ]
        }
      },
      expected: {
        errors: [
          { type: 'item', pattern: '损毁' }
        ]
      }
    },
    {
      id: 'ISV-003',
      name: '存在物品可以变为丢失或损毁',
      description: '验证存在状态的物品可以变为丢失或损毁',
      input: {
        characters: [],
        items: [
          { name: '玄铁剑', status: '存在', owner: '张三' }
        ],
        locations: [],
        minorCharacters: [],
        worldState: {},
        updates: {
          item_updates: [
            { name: '玄铁剑', type: '武器', owner: '张三', status: '丢失', is_new: false }
          ]
        }
      },
      expected: {
        shouldPass: true
      }
    }
  ],

  locationStatusValidation: [
    {
      id: 'LSV-001',
      name: '毁灭地点不能恢复',
      description: '验证毁灭状态的地点不能被更新为正常',
      input: {
        characters: [],
        items: [],
        locations: [
          { name: '火焰山', status: '毁灭' }
        ],
        minorCharacters: [],
        worldState: {},
        updates: {
          location_updates: [
            { name: '火焰山', type: '山脉', status: '正常', is_new: false }
          ]
        }
      },
      expected: {
        errors: [
          { type: 'location', pattern: '毁灭' }
        ]
      }
    },
    {
      id: 'LSV-002',
      name: '正常地点可以封闭或毁灭',
      description: '验证正常状态的地点可以变为封闭或毁灭',
      input: {
        characters: [],
        items: [],
        locations: [
          { name: '火焰山', status: '正常' }
        ],
        minorCharacters: [],
        worldState: {},
        updates: {
          location_updates: [
            { name: '火焰山', type: '山脉', status: '封闭', is_new: false }
          ]
        }
      },
      expected: {
        shouldPass: true
      }
    }
  ],

  consistencyValidation: [
    {
      id: 'COV-001',
      name: '检测角色复活',
      description: '验证能检测到角色从死亡状态变为非死亡状态',
      input: {
        characters: [
          { name: '张三', status: '死亡', level: 10 }
        ],
        history: [
          {
            character_updates: [
              { name: '张三', new_status: '死亡' }
            ]
          }
        ],
        currentContent: '张三重生后...',
        currentUpdates: {
          character_updates: [
            { name: '张三', new_status: '正常' }
          ]
        },
        items: [],
        locations: []
      },
      expected: {
        issues: [
          { type: 'character_resurrection' }
        ]
      }
    },
    {
      id: 'COV-002',
      name: '检测物品非法恢复',
      description: '验证能检测到物品从丢失状态变为存在状态',
      input: {
        characters: [],
        history: [
          {
            item_updates: [
              { name: '玄铁剑', status: '丢失' }
            ]
          }
        ],
        currentContent: '玄铁剑出现在张三手中...',
        currentUpdates: {
          item_updates: [
            { name: '玄铁剑', status: '存在' }
          ]
        },
        items: [
          { name: '玄铁剑', status: '丢失' }
        ],
        locations: []
      },
      expected: {
        issues: [
          { type: 'item_invalid_recovery' }
        ]
      }
    }
  ]
};

async function runValidationTests() {
  console.log('[TestRunner] 开始运行验证测试...');

  const suite = new TestSuite('验证规则测试');

  for (const tc of TestCases.characterStatusValidation) {
    suite.addTest(new ValidationTestCase(tc));
  }
  for (const tc of TestCases.itemStatusValidation) {
    suite.addTest(new ValidationTestCase(tc));
  }
  for (const tc of TestCases.locationStatusValidation) {
    suite.addTest(new ValidationTestCase(tc));
  }
  for (const tc of TestCases.consistencyValidation) {
    suite.addTest(new ConsistencyTestCase(tc));
  }

  await suite.runAll();

  const summary = suite.getSummary();

  console.log('[TestRunner] 测试完成:', JSON.stringify(summary, null, 2));

  return summary;
}

async function runAllTests() {
  const results = {
    validation: await runValidationTests()
  };

  return results;
}

export { TestCase, ValidationTestCase, ConsistencyTestCase, RealmTestCase, TestSuite, TestCases, runValidationTests, runAllTests };
export default { TestCase, ValidationTestCase, ConsistencyTestCase, RealmTestCase, TestSuite, TestCases, runValidationTests, runAllTests };
