# 代码重构指南

## 概述

本项目已完成代码重构和优化，包括：
- 提取公共组件和工具函数
- 使用Composition API重构复杂组件
- Pinia模块化
- 后端代码分层（Repository层、Service层）

## 前端重构

### 1. Composition API (Composables)

#### 已创建的Composables

**useAIGeneration** - AI生成逻辑
```javascript
import { useAIGeneration } from '@/composables/useAIGeneration';

const { generating, streamingContent, generateStream, generate } = useAIGeneration();

// 流式生成
const content = await generateStream(prompt, { maxTokens: 2000 });

// 非流式生成
const result = await generate(prompt);
```

**useDialog** - 对话框管理
```javascript
import { useDialog, useDialogs } from '@/composables/useDialog';

// 单个对话框
const dialog = useDialog();
dialog.open();
dialog.close();

// 多个对话框
const dialogs = useDialogs(['world', 'character', 'outline']);
dialogs.world.open();
```

**useForm** - 表单管理
```javascript
import { useForm } from '@/composables/useForm';

const { form, errors, loading, validate, reset } = useForm(
  { title: '', genre: '' },
  {
    title: [{ required: true, message: '标题不能为空' }],
    genre: [{ required: true, message: '类型不能为空' }]
  }
);

if (validate()) {
  // 提交表单
}
```

**useNovel** - 小说业务逻辑
```javascript
import { useNovel } from '@/composables/useNovel';

const {
  loading,
  novel,
  worldState,
  characters,
  totalWordCount,
  loadNovelDetail,
  updateWorldState,
  addNewCharacter
} = useNovel();

await loadNovelDetail(novelId);
```

### 2. 公共组件

#### LoadingState - 加载状态
```vue
<LoadingState type="skeleton" :rows="5" />
<LoadingState type="spinner" text="加载中..." />
```

#### EmptyState - 空状态
```vue
<EmptyState 
  description="暂无数据" 
  action-text="创建新项目"
  @action="handleCreate"
/>
```

#### BaseCard - 基础卡片
```vue
<BaseCard title="标题" hoverable>
  <template #extra>
    <el-button>操作</el-button>
  </template>
  内容
</BaseCard>
```

#### BaseDialog - 基础对话框
```vue
<BaseDialog
  v-model="visible"
  title="对话框标题"
  :loading="loading"
  @confirm="handleConfirm"
  @cancel="handleCancel"
>
  对话框内容
</BaseDialog>
```

### 3. 工具函数

#### validators.js - 表单验证
```javascript
import { required, minLength, email, jsonFormat } from '@/utils/validators';

const rules = {
  title: [required('标题不能为空'), minLength(2)],
  email: [required(), email()],
  config: [jsonFormat()]
};
```

#### formatters.js - 格式化工具
```javascript
import { 
  formatDate, 
  formatRelativeTime, 
  formatWordCount,
  truncate 
} from '@/utils/formatters';

formatDate(new Date(), 'YYYY-MM-DD'); // 2024-01-01
formatRelativeTime(date); // 3小时前
formatWordCount(15000); // 1.5万字
truncate(text, 100); // 截断文本
```

### 4. 使用示例

#### 重构前（Options API）
```vue
<script>
export default {
  data() {
    return {
      loading: false,
      form: { title: '' },
      dialogVisible: false
    };
  },
  methods: {
    async submit() {
      this.loading = true;
      try {
        await api.create(this.form);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

#### 重构后（Composition API）
```vue
<script setup>
import { useForm } from '@/composables/useForm';
import { useDialog } from '@/composables/useDialog';

const { form, loading, validate } = useForm({ title: '' });
const dialog = useDialog();

const submit = async () => {
  if (!validate()) return;
  loading.value = true;
  try {
    await api.create(form);
    dialog.close();
  } finally {
    loading.value = false;
  }
};
</script>
```

## 后端重构

### 1. Repository层

Repository层负责数据库操作，提供统一的数据访问接口。

#### BaseRepository - 基础Repository
```javascript
import { BaseRepository } from './BaseRepository.js';

class MyRepository extends BaseRepository {
  constructor() {
    super('table_name');
  }

  async customMethod() {
    return this.findMany({ status: 'active' });
  }
}
```

#### 已创建的Repository

- **NovelRepository** - 小说数据访问
- **CharacterRepository** - 角色数据访问
- **WorldStateRepository** - 世界设定数据访问
- **ContentRepository** - 内容数据访问

#### 使用示例
```javascript
import CharacterRepository from '../repositories/CharacterRepository.js';

// 查询角色
const characters = await CharacterRepository.findByNovelId(novelId);

// 创建角色
const id = await CharacterRepository.create(novelId, {
  name: '主角',
  level: 1,
  status: '正常'
});

// 更新角色
await CharacterRepository.updateStatus(novelId, '主角', '受伤');

// 批量更新
await CharacterRepository.batchUpdate(novelId, updates);
```

### 2. Service层

Service层负责业务逻辑，调用Repository进行数据操作。

#### CharacterService - 角色业务逻辑
```javascript
import CharacterService from '../services/CharacterService.js';

// 创建角色（包含验证）
await CharacterService.createCharacter(novelId, characterData);

// 更新角色状态（防止复活）
await CharacterService.updateCharacterStatus(novelId, name, status);

// 批量更新（包含验证）
await CharacterService.batchUpdateCharacters(novelId, updates);
```

#### WorldStateService - 世界设定业务逻辑
```javascript
import WorldStateService from '../services/WorldStateService.js';

// 获取世界设定
const worldState = await WorldStateService.getWorldState(novelId);

// 更新世界设定
await WorldStateService.updateWorldState(novelId, worldData);

// 验证境界升级
const validation = WorldStateService.validateRealmUpgrade(
  currentRealm,
  newRealm,
  realmSystem
);
```

### 3. 分层架构

```
Controller层 (novelController.js)
    ↓ 调用
Service层 (CharacterService.js, WorldStateService.js)
    ↓ 调用
Repository层 (CharacterRepository.js, WorldStateRepository.js)
    ↓ 操作
Database (MySQL)
```

#### 优势

1. **职责分离**：每层只负责自己的职责
2. **易于测试**：可以单独测试每一层
3. **代码复用**：Repository和Service可以被多个Controller使用
4. **易于维护**：修改数据库操作只需修改Repository层

### 4. 重构示例

#### 重构前（直接在Service中操作数据库）
```javascript
class NovelService {
  async getCharacters(novelId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        'SELECT * FROM character_state WHERE novel_id = ?',
        [novelId]
      );
      return rows;
    } finally {
      conn.release();
    }
  }
}
```

#### 重构后（使用Repository）
```javascript
// Repository层
class CharacterRepository extends BaseRepository {
  async findByNovelId(novelId) {
    return this.findMany({ novel_id: novelId });
  }
}

// Service层
class CharacterService {
  async getCharacters(novelId) {
    return await CharacterRepository.findByNovelId(novelId);
  }
}
```

## 迁移指南

### 前端组件迁移

1. **识别可复用逻辑**
   - 查找重复的代码模式
   - 提取为Composable

2. **使用Composition API重写**
   - 将data转换为ref/reactive
   - 将methods转换为函数
   - 使用setup语法糖

3. **使用公共组件**
   - 替换重复的UI组件
   - 使用BaseDialog、BaseCard等

### 后端代码迁移

1. **创建Repository**
   - 继承BaseRepository
   - 实现特定的查询方法

2. **重构Service**
   - 使用Repository替代直接数据库操作
   - 添加业务逻辑验证

3. **更新Controller**
   - 调用Service方法
   - 处理HTTP请求和响应

## 最佳实践

### 前端

1. **Composable命名**：使用`use`前缀，如`useDialog`
2. **组件命名**：使用PascalCase，如`BaseCard`
3. **工具函数**：使用camelCase，如`formatDate`
4. **保持单一职责**：每个Composable只做一件事

### 后端

1. **Repository命名**：使用实体名+Repository，如`CharacterRepository`
2. **Service命名**：使用实体名+Service，如`CharacterService`
3. **方法命名**：使用动词开头，如`findByNovelId`、`createCharacter`
4. **错误处理**：在Service层抛出业务异常，在Controller层捕获

## 性能优化

### 前端

1. **按需加载**：使用动态import加载组件
2. **虚拟滚动**：大列表使用RecycleScroller
3. **防抖节流**：使用lodash的debounce和throttle
4. **缓存计算**：使用computed缓存计算结果

### 后端

1. **数据库连接池**：复用数据库连接
2. **批量操作**：使用事务批量更新
3. **索引优化**：为常用查询字段添加索引
4. **缓存策略**：使用Redis缓存热点数据

## 测试

### 前端测试

```javascript
import { mount } from '@vue/test-utils';
import { useDialog } from '@/composables/useDialog';

describe('useDialog', () => {
  it('should open and close dialog', () => {
    const { visible, open, close } = useDialog();
    
    expect(visible.value).toBe(false);
    open();
    expect(visible.value).toBe(true);
    close();
    expect(visible.value).toBe(false);
  });
});
```

### 后端测试

```javascript
import CharacterRepository from '../repositories/CharacterRepository.js';

describe('CharacterRepository', () => {
  it('should find characters by novel id', async () => {
    const characters = await CharacterRepository.findByNovelId(1);
    expect(characters).toBeInstanceOf(Array);
  });
});
```

## 总结

通过本次重构，项目代码结构更加清晰，可维护性和可测试性大大提升。建议在后续开发中：

1. 优先使用Composable封装可复用逻辑
2. 使用公共组件减少重复代码
3. 遵循分层架构，保持代码整洁
4. 编写单元测试，确保代码质量
