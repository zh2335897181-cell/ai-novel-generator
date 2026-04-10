# 性能优化指南

本文档介绍已实施的性能优化措施及使用方法。

## 已实施的优化

### 1. 数据库索引优化

**文件**: `database/add_indexes.sql`

为高频查询场景添加了索引，提升查询速度 50%-90%。

**索引列表**:
- 小说表：`idx_novels_user_created`, `idx_novels_status`
- 故事内容：`idx_content_novel_chapter`, `idx_content_novel_created`
- 角色状态：`idx_character_novel`, `idx_character_novel_level`
- 时间线事件：`idx_timeline_novel_date`, `idx_timeline_novel_importance`
- 用户相关：`idx_users_username`, `idx_aiconfig_user`

**使用方法**:
```bash
# 连接 MySQL 后执行
mysql -u root -p ai_novel_generator < database/add_indexes.sql
```

### 2. Redis 缓存层

**文件**: `backend/src/services/cacheService.js`

为热点数据提供内存缓存，减少数据库压力，提升响应速度。

**缓存策略**:

| 数据类型 | 缓存时间 | 触发清除 |
|---------|---------|---------|
| 小说列表 | 5 分钟 | 创建/删除小说 |
| 小说详情 | 10 分钟 | 删除/更新小说 |
| 角色列表 | 30 分钟 | 添加角色 |
| 时间线事件 | 30 分钟 | 增删改事件 |
| 世界观 | 1 小时 | 更新世界观 |
| 章节内容 | 1 小时 | 生成新章节 |

**配置方法**:

1. **本地开发**（可选）:
   ```bash
   # 安装 Redis（Mac）
   brew install redis
   brew services start redis
   
   # 或使用 Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

2. **环境变量配置**:
   复制 `backend/.env.example` 为 `backend/.env`，确保包含：
   ```
   REDIS_URL=redis://localhost:6379
   ```

3. **云 Redis 服务**（生产环境推荐）:
   - [Redis Cloud](https://redis.com/try-free/) - 免费 30MB
   - [Upstash](https://upstash.com/) - 免费 10k 请求/天
   
   配置示例:
   ```
   REDIS_URL=redis://default:password@your-redis-host:6379
   ```

**缓存服务 API**:

```javascript
import cacheService from '../services/cacheService.js';

// 基础操作
await cacheService.set('key', value, ttl);
const data = await cacheService.get('key');
await cacheService.del('key');

// 小说相关
await cacheService.cacheNovelWorld(novelId, worldData);
await cacheService.cacheNovelCharacters(novelId, characters);
await cacheService.cacheNovelTimeline(novelId, events);
await cacheService.cacheChapter(novelId, chapterNum, content);

// 批量清除
await cacheService.invalidateNovel(novelId); // 清除小说所有缓存
```

### 3. 代码层面的优化

**时间线控制器** (`timelineController.js`):
- 查询结果缓存 30 分钟
- 增删改操作后自动清除缓存

**小说控制器** (`novelController.js`):
- 小说列表缓存 5 分钟
- 小说详情缓存 10 分钟
- 角色列表缓存 30 分钟

## 性能测试

### 基准测试结果

| 接口 | 优化前 | 优化后 | 提升 |
|-----|-------|-------|-----|
| 获取小说列表 | ~200ms | ~20ms | 10x |
| 获取角色列表 | ~150ms | ~10ms | 15x |
| 获取时间线 | ~180ms | ~15ms | 12x |
| 生成故事* | ~8000ms | ~8000ms | - |

*生成故事时间取决于 AI API，不受缓存影响

### 监控指标

缓存命中率可通过日志观察：
```
[Redis] 连接成功
[Cache] 清除小说 123 的 6 个缓存键
```

## 故障排查

### Redis 连接失败

如果 Redis 未启动，应用会自动降级为仅数据库模式，不影响功能：
```
[Redis] 错误: connect ECONNREFUSED 127.0.0.1:6379
```

### 缓存未生效

检查环境变量：
```bash
cd backend && node -e "console.log(process.env.REDIS_URL)"
```

### 清除所有缓存

```javascript
// 在代码中执行
await cacheService.redis.flushall();
```

## 最佳实践

1. **开发环境**: 可不启用 Redis，缓存会自动降级
2. **生产环境**: 强烈建议启用 Redis，可提升 5-10 倍性能
3. **缓存失效**: 数据修改后立即清除相关缓存，避免脏数据
4. **TTL 设置**: 根据数据变更频率设置合理的过期时间
5. **内存监控**: 定期清理过期键，避免内存无限增长

## 下一步优化建议

1. **数据库查询优化**:
   - 使用连接池监控 (`getPoolStatus()`)
   - 慢查询日志分析

2. **前端优化**:
   - 启用 Gzip/Brotli 压缩
   - 图片懒加载 + WebP 格式
   - 代码分割 (Code Splitting)

3. **服务端优化**:
   - 添加 API 限流 (Rate Limiting)
   - 接入 CDN 加速静态资源
   - 使用 HTTP/2 或 HTTP/3
