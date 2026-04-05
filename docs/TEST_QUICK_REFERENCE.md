# 测试快速参考

## 常用命令

### 后端测试
```bash
cd backend

# 运行所有测试
npm test

# 运行特定测试文件
npm test -- novelService.test.js

# 监听模式
npm run test:watch

# 覆盖率报告
npm run test:coverage

# 只运行失败的测试
npm test -- --onlyFailures
```

### 前端测试
```bash
cd frontend

# 运行所有测试
npm test

# 运行特定测试文件
npm test -- src/stores/__tests__/novelStore.test.js

# 测试UI
npm run test:ui

# 覆盖率报告
npm run test:coverage

# 监听模式
npm test -- --watch
```

### E2E测试
```bash
cd frontend

# 运行所有E2E测试
npm run test:e2e

# 运行特定测试文件
npx playwright test e2e/auth.spec.js

# UI模式
npm run test:e2e:ui

# 调试模式
npx playwright test --debug

# 只运行Chrome
npx playwright test --project=chromium

# 生成测试报告
npx playwright show-report
```

## 常用断言

### Jest/Vitest断言
```javascript
// 相等性
expect(value).toBe(expected)           // 严格相等 ===
expect(value).toEqual(expected)        // 深度相等
expect(value).not.toBe(expected)       // 不相等

// 真值
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// 数字
expect(value).toBeGreaterThan(3)
expect(value).toBeGreaterThanOrEqual(3)
expect(value).toBeLessThan(5)
expect(value).toBeCloseTo(0.3)         // 浮点数

// 字符串
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// 数组
expect(array).toContain(item)
expect(array).toHaveLength(3)

// 对象
expect(object).toHaveProperty('key')
expect(object).toHaveProperty('key', value)
expect(object).toMatchObject({ key: value })

// 异常
expect(() => fn()).toThrow()
expect(() => fn()).toThrow(Error)
expect(() => fn()).toThrow('error message')

// 异步
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()

// Mock函数
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledTimes(2)
expect(mockFn).toHaveBeenCalledWith(arg1, arg2)
```

### Playwright断言
```javascript
// 可见性
await expect(page.locator('text=Hello')).toBeVisible()
await expect(page.locator('.hidden')).toBeHidden()

// 文本内容
await expect(page.locator('h1')).toHaveText('Title')
await expect(page.locator('p')).toContainText('partial')

// 属性
await expect(page.locator('input')).toHaveAttribute('type', 'text')
await expect(page.locator('button')).toBeEnabled()
await expect(page.locator('button')).toBeDisabled()

// URL
await expect(page).toHaveURL(/\/dashboard/)
await expect(page).toHaveTitle(/Dashboard/)

// 数量
await expect(page.locator('.item')).toHaveCount(5)
```

## Mock示例

### Mock函数
```javascript
import { jest } from '@jest/globals';

// 创建mock函数
const mockFn = jest.fn();

// 设置返回值
mockFn.mockReturnValue(42);
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2);

// 设置异步返回值
mockFn.mockResolvedValue('success');
mockFn.mockRejectedValue(new Error('failed'));

// 设置实现
mockFn.mockImplementation((x) => x * 2);
```

### Mock模块
```javascript
// 完全mock模块
jest.mock('./module');

// 部分mock
jest.mock('./module', () => ({
  ...jest.requireActual('./module'),
  specificFunction: jest.fn()
}));

// Mock默认导出
jest.mock('./module', () => ({
  default: jest.fn()
}));
```

### Mock Axios
```javascript
import axios from 'axios';
import { vi } from 'vitest';

vi.mock('axios');

axios.get.mockResolvedValue({
  data: { id: 1, name: 'Test' }
});
```

## Vue组件测试

### 挂载组件
```javascript
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

const wrapper = mount(MyComponent, {
  props: {
    title: 'Test'
  },
  global: {
    plugins: [router, pinia],
    stubs: {
      'router-link': true
    }
  }
});
```

### 查找元素
```javascript
// 通过选择器
wrapper.find('button')
wrapper.find('.class-name')
wrapper.find('#id')

// 通过组件
wrapper.findComponent(ChildComponent)

// 查找所有
wrapper.findAll('li')
```

### 触发事件
```javascript
await wrapper.find('button').trigger('click')
await wrapper.find('input').setValue('text')
await wrapper.find('select').setValue('option1')
```

### 检查输出
```javascript
// 文本内容
expect(wrapper.text()).toContain('Hello')

// HTML
expect(wrapper.html()).toContain('<div>')

// Props
expect(wrapper.props('title')).toBe('Test')

// Emitted事件
expect(wrapper.emitted('submit')).toBeTruthy()
expect(wrapper.emitted('submit')[0]).toEqual([data])
```

## Playwright常用操作

### 导航
```javascript
await page.goto('https://example.com')
await page.goBack()
await page.goForward()
await page.reload()
```

### 点击和输入
```javascript
await page.click('button')
await page.fill('input[name="email"]', 'test@example.com')
await page.type('input', 'text', { delay: 100 })
await page.selectOption('select', 'value')
await page.check('input[type="checkbox"]')
```

### 等待
```javascript
await page.waitForSelector('.element')
await page.waitForURL(/\/dashboard/)
await page.waitForLoadState('networkidle')
await page.waitForTimeout(1000)
```

### 截图和录制
```javascript
await page.screenshot({ path: 'screenshot.png' })
await page.screenshot({ fullPage: true })
```

## 调试技巧

### 使用console.log
```javascript
it('debug test', () => {
  const data = { name: 'test' };
  console.log('Data:', data);
  expect(data.name).toBe('test');
});
```

### 使用debugger
```javascript
it('debug test', () => {
  debugger; // 在这里暂停
  expect(true).toBe(true);
});
```

### Playwright调试
```javascript
// 在测试中暂停
await page.pause();

// 慢动作执行
const browser = await chromium.launch({ slowMo: 1000 });
```

## 性能优化

### 并行运行测试
```javascript
// Jest
jest --maxWorkers=4

// Vitest
vitest --threads

// Playwright
playwright test --workers=4
```

### 跳过慢测试
```javascript
it.skip('slow test', () => {
  // 跳过这个测试
});

it.only('focus test', () => {
  // 只运行这个测试
});
```

### 使用beforeAll
```javascript
describe('suite', () => {
  let data;
  
  beforeAll(async () => {
    // 只运行一次
    data = await fetchData();
  });
  
  it('test 1', () => {
    expect(data).toBeDefined();
  });
});
```

## 故障排除

### 测试超时
```javascript
// 增加超时时间
it('long test', async () => {
  // test code
}, 30000); // 30秒
```

### 清理Mock
```javascript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 异步问题
```javascript
// 确保等待异步操作
await wrapper.vm.$nextTick();
await flushPromises();
```

## 资源

- [Jest文档](https://jestjs.io/)
- [Vitest文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright文档](https://playwright.dev/)
