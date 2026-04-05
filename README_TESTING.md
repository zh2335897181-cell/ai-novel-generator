# 测试快速开始指南

## 安装测试依赖

### 后端
```bash
cd backend
npm install
```

### 前端
```bash
cd frontend
npm install
npx playwright install  # 安装Playwright浏览器
```

## 快速运行测试

### 运行所有测试（Windows）
```bash
test-all.bat
```

### 运行所有测试（Linux/Mac）
```bash
chmod +x test-all.sh
./test-all.sh
```

### 单独运行测试

#### 后端测试
```bash
cd backend
npm test                    # 运行所有测试
npm run test:watch          # 监听模式
npm run test:coverage       # 生成覆盖率报告
```

#### 前端单元测试
```bash
cd frontend
npm test                    # 运行所有测试
npm run test:ui             # 打开测试UI
npm run test:coverage       # 生成覆盖率报告
```

#### E2E测试
```bash
cd frontend
npm run test:e2e            # 运行E2E测试
npm run test:e2e:ui         # 打开Playwright UI
```

## 测试覆盖率

运行测试后，覆盖率报告将生成在：
- 后端: `backend/coverage/`
- 前端: `frontend/coverage/`

在浏览器中打开 `coverage/index.html` 查看详细报告。

## CI/CD

测试会在以下情况自动运行：
- Push到main或develop分支
- 创建Pull Request

查看 `.github/workflows/ci.yml` 了解详细配置。

## 更多信息

详细的测试文档请查看 `docs/TESTING.md`
