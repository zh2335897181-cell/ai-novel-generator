# 测试文档

## 概述

本项目包含完整的测试套件，包括单元测试、集成测试和E2E测试。

## 测试框架

### 后端测试
- **Jest**: 单元测试和集成测试框架
- **Supertest**: API接口测试

### 前端测试
- **Vitest**: 单元测试框架（Vue 3优化）
- **Vue Test Utils**: Vue组件测试工具
- **Playwright**: E2E测试框架

## 运行测试

### 后端测试

```bash
cd backend

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 前端测试

```bash
cd frontend

# 运行单元测试
npm test

# 监听模式
npm run test:watch

# 测试UI界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage

# 运行E2E测试
npm run test:e2e

# E2E测试UI模式
npm run test:e2e:ui
```

## 测试结构

### 后端测试结构

```
backend/src/
├── __tests__/
│   ├── setup.js                    # 测试环境配置
│   ├── controllers/
│   │   └── novelController.test.js # 控制器测试
│   ├── services/
│   │   └── novelService.test.js    # 服务层测试
│   ├── utils/
│   │   └── aiClient.test.js        # 工具函数测试
│   └── integration/
│       └── api.test.js             # API集成测试
```

### 前端测试结构

```
frontend/
├── src/
│   ├── components/__tests__/       # 组件测试
│   ├── stores/__tests__/           # 状态管理测试
│   ├── utils/__tests__/            # 工具函数测试
│   ├── views/__tests__/            # 页面测试
│   └── test-utils.js               # 测试工具函数
└── e2e/                            # E2E测试
    ├── auth.spec.js
    ├── novel-creation.spec.js
    ├── content-generation.spec.js
    └── character-management.spec.js
```

## 测试覆盖率目标

- 代码行覆盖率: ≥ 70%
- 分支覆盖率: ≥ 70%
- 函数覆盖率: ≥ 70%
- 语句覆盖率: ≥ 70%

## 编写测试指南

### 单元测试最佳实践

1. **测试命名**: 使用描述性的测试名称
```javascript
it('should create novel with valid data', async () => {
  // test code
});
```

2. **AAA模式**: Arrange（准备）、Act（执行）、Assert（断言）
```javascript
it('should return user by id', async () => {
  // Arrange
  const userId = 1;
  
  // Act
  const user = await getUserById(userId);
  
  // Assert
  expect(user.id).toBe(userId);
});
```

3. **Mock外部依赖**: 隔离测试单元
```javascript
jest.mock('../../services/aiService');
```

### 组件测试最佳实践

1. **测试用户交互**
```javascript
it('should submit form on button click', async () => {
  const wrapper = mount(MyComponent);
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('submit')).toBeTruthy();
});
```

2. **测试Props和Events**
```javascript
it('should render with props', () => {
  const wrapper = mount(MyComponent, {
    props: { title: 'Test' }
  });
  expect(wrapper.text()).toContain('Test');
});
```

### E2E测试最佳实践

1. **使用Page Object模式**
2. **测试关键用户流程**
3. **避免测试实现细节**
4. **使用有意义的等待**

```javascript
test('should complete checkout flow', async ({ page }) => {
  await page.goto('/products');
  await page.click('text=Add to Cart');
  await page.click('text=Checkout');
  await expect(page).toHaveURL(/\/checkout/);
});
```

## CI/CD集成

测试在以下情况自动运行：
- Push到main或develop分支
- 创建Pull Request
- 手动触发workflow

### GitHub Actions工作流

1. **backend-test**: 运行后端测试
2. **frontend-test**: 运行前端测试
3. **e2e-test**: 运行E2E测试
4. **lint**: 代码质量检查
5. **security**: 安全审计

## 调试测试

### 调试单元测试

```bash
# 使用Node调试器
node --inspect-brk node_modules/.bin/jest --runInBand

# 使用VS Code调试配置
# 在.vscode/launch.json中添加配置
```

### 调试E2E测试

```bash
# 使用Playwright UI模式
npm run test:e2e:ui

# 使用调试模式
npx playwright test --debug
```

## 常见问题

### 测试超时
增加超时时间：
```javascript
test('long running test', async () => {
  // test code
}, 30000); // 30秒超时
```

### 异步测试
确保使用async/await或返回Promise：
```javascript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Mock不生效
确保在导入模块前设置mock：
```javascript
jest.mock('./module');
import { myFunction } from './module';
```

## 持续改进

- 定期审查测试覆盖率
- 更新测试以反映新功能
- 重构脆弱的测试
- 添加缺失的测试用例
- 优化测试执行时间

## 资源链接

- [Jest文档](https://jestjs.io/)
- [Vitest文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright文档](https://playwright.dev/)
