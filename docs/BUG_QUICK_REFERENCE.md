# 🐛 Bug快速参考表

## 严重Bug (需立即修复)

| # | Bug | 文件 | 行号 | 影响 | 修复难度 |
|---|-----|------|------|------|---------|
| 1 | 白屏问题 - 路由过渡动画 | frontend/src/App.vue | 1-10 | 用户无法查看详情页 | ⭐ 简单 |
| 2 | 数据库连接泄漏 | backend/src/services/novelService.js | 多处 | 服务器崩溃 | ⭐⭐ 中等 |
| 3 | 缺少路由守卫 | frontend/src/router/index.js | 全文 | 安全风险 | ⭐⭐ 中等 |
| 4 | 缺少输入验证 | backend/src/controllers/novelController.js | 多处 | SQL注入风险 | ⭐⭐ 中等 |
| 5 | localStorage存储API Key | frontend/src/stores/aiConfig.js | 15-20 | 安全风险 | ⭐ 简单 |
| 6 | 流式响应未关闭 | backend/src/services/novelService.js | generateStoryStream | 连接泄漏 | ⭐⭐ 中等 |
| 7 | 事务处理不完整 | backend/src/services/novelService.js | 多处 | 数据不一致 | ⭐⭐ 中等 |
| 8 | 缺少错误处理中间件 | backend/src/index.js | 全文 | 服务器崩溃 | ⭐⭐ 中等 |
| 9 | JSON字段处理不一致 | backend/src/config/database.js | 全文 | 数据错误 | ⭐⭐ 中等 |
| 10 | 缺少SSE超时控制 | frontend/src/views/NovelDetail.vue | generateStoryStream | 应用卡死 | ⭐⭐ 中等 |
| 11 | 缺少CORS配置 | backend/src/index.js | 全文 | 跨域请求失败 | ⭐ 简单 |
| 12 | 环境变量明文存储 | backend/.env | 全文 | 安全风险 | ⭐ 简单 |
| 13 | 缺少速率限制 | backend/src/index.js | 全文 | DDoS风险 | ⭐⭐ 中等 |
| 14 | 缺少请求体大小限制 | backend/src/index.js | 全文 | 大请求攻击 | ⭐ 简单 |
| 15 | 缺少连接超时 | backend/src/config/database.js | 全文 | 无限等待 | ⭐ 简单 |

---

## 高优先级Bug

| # | Bug | 文件 | 影响 | 修复难度 |
|---|-----|------|------|---------|
| 16 | 组件导入缺失 | frontend/src/views/NovelDetail.vue | 路由跳转失败 | ⭐ 简单 |
| 17 | 循环依赖 | frontend/src/stores/ | 模块加载失败 | ⭐⭐ 中等 |
| 18 | 缺少try-catch | frontend/src/views/NovelList.vue | 网络错误处理 | ⭐ 简单 |
| 19 | 错误消息不清晰 | frontend/src/api/novel.js | 用户体验差 | ⭐ 简单 |
| 20 | 状态初始化不完整 | frontend/src/views/NovelDetail.vue | 模板渲染错误 | ⭐ 简单 |
| 21 | 缺少API Key验证 | frontend/src/stores/aiConfig.js | 无效配置 | ⭐ 简单 |
| 22 | 缺少日志系统 | backend/ | 调试困难 | ⭐⭐⭐ 复杂 |
| 23 | 缺少数据验证 | backend/src/services/novelService.js | 数据错误 | ⭐⭐ 中等 |
| 24 | 缺少事务回滚 | backend/src/services/novelService.js | 数据不一致 | ⭐⭐ 中等 |
| 25 | 缺少请求超时 | frontend/src/api/novel.js | 无限等待 | ⭐ 简单 |
| 26 | 缺少响应验证 | frontend/src/api/novel.js | 错误消息undefined | ⭐ 简单 |
| 27 | API路由参数不一致 | backend/src/routes/index.js | API调用失败 | ⭐ 简单 |

---

## 中优先级Bug (性能/安全)

| # | Bug | 文件 | 影响 | 修复难度 |
|---|-----|------|------|---------|
| 28 | N+1查询问题 | backend/src/services/novelService.js | 性能下降 | ⭐⭐ 中等 |
| 29 | 缺少缓存 | backend/ | 资源浪费 | ⭐⭐⭐ 复杂 |
| 30 | 缺少分页 | backend/src/services/novelService.js | 性能下降 | ⭐⭐ 中等 |
| 31 | 缺少数据库索引 | database/schema.sql | 查询慢 | ⭐⭐ 中等 |
| 32 | 参数化查询遗漏 | backend/src/services/novelService.js | SQL注入风险 | ⭐⭐ 中等 |
| 33 | 缺少HTTPS强制 | backend/src/index.js | 中间人攻击 | ⭐ 简单 |
| 34 | 缺少请求验证 | backend/src/controllers/novelController.js | 数据错误 | ⭐⭐ 中等 |
| 35 | 缺少访问控制 | backend/src/controllers/novelController.js | 权限绕过 | ⭐⭐ 中等 |

---

## 低优先级Bug (代码质量)

| # | Bug | 文件 | 影响 | 修复难度 |
|---|-----|------|------|---------|
| 36 | 未使用的变量 | backend/src/utils/aiClient.js | 代码混乱 | ⭐ 简单 |
| 37 | 缺少注释 | 整个项目 | 难以维护 | ⭐⭐ 中等 |
| 38 | 不一致的命名 | 整个项目 | 难以理解 | ⭐⭐ 中等 |
| 39 | 缺少单元测试 | 整个项目 | 无法保证质量 | ⭐⭐⭐ 复杂 |
| 40 | 缺少类型检查 | 整个项目 | 类型错误 | ⭐⭐⭐ 复杂 |

---

## 🚀 修复建议

### 第一天 (紧急修复)
```
Bug #1  - 白屏问题 (5分钟)
Bug #5  - localStorage安全 (10分钟)
Bug #12 - 环境变量 (10分钟)
Bug #14 - 请求体大小限制 (5分钟)
Bug #15 - 连接超时 (5分钟)
```

### 第二天 (核心功能修复)
```
Bug #2  - 数据库连接泄漏 (30分钟)
Bug #3  - 路由守卫 (20分钟)
Bug #4  - 输入验证 (30分钟)
Bug #6  - 流式响应 (20分钟)
Bug #7  - 事务处理 (30分钟)
```

### 第三天 (安全加固)
```
Bug #8  - JSON字段处理 (20分钟)
Bug #9  - 错误处理中间件 (20分钟)
Bug #11 - CORS配置 (10分钟)
Bug #13 - 速率限制 (30分钟)
```

### 第四天 (功能完善)
```
Bug #10 - SSE超时控制 (20分钟)
Bug #16 - 组件导入 (10分钟)
Bug #18-26 - 其他高优先级 (60分钟)
```

---

## 📝 修复模板

### 修复数据库连接泄漏
```javascript
async createNovel(userId, title) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // ... 操作
    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
}
```

### 修复输入验证
```javascript
async create(req, res) {
  const { title } = req.body;
  
  // 验证
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: '标题必须是字符串' });
  }
  if (title.length > 100) {
    return res.status(400).json({ message: '标题长度不能超过100字' });
  }
  
  // ... 继续处理
}
```

### 修复路由守卫
```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});
```

### 修复错误处理
```javascript
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

## 🔍 测试检查清单

- [ ] 点击小说详情页是否正常加载（不需要刷新）
- [ ] 创建小说是否成功
- [ ] 生成故事是否正常
- [ ] 流式生成是否能正确显示进度
- [ ] 未登录用户是否被拦截
- [ ] 输入特殊字符是否被正确处理
- [ ] 长时间无响应是否有超时提示
- [ ] 数据库连接是否正常释放
- [ ] 错误消息是否清晰
- [ ] 移动端是否正常显示

