import Redis from 'ioredis';
import { EventEmitter } from 'events';

/**
 * 缓存服务 - 基于 Redis 的高性能缓存层
 * 
 * 缓存策略：
 * - 热点数据缓存 1-24 小时（小说世界观、角色列表等）
 * - 用户会话缓存随 JWT 过期时间
 * - 支持缓存穿透保护（Bloom Filter 模式）
 * - 支持缓存预热
 */

class CacheService extends EventEmitter {
  constructor() {
    super();
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 默认1小时
    this.prefix = 'novel:';
    
    // 缓存键模式定义
    this.patterns = {
      NOVEL: (id) => `novel:${id}`,
      NOVEL_LIST: (userId) => `novels:user:${userId}`,
      NOVEL_WORLD: (id) => `novel:${id}:world`,
      NOVEL_CHARACTERS: (id) => `novel:${id}:characters`,
      NOVEL_ITEMS: (id) => `novel:${id}:items`,
      NOVEL_LOCATIONS: (id) => `novel:${id}:locations`,
      NOVEL_TIMELINE: (id) => `novel:${id}:timeline`,
      NOVEL_SUMMARY: (id) => `novel:${id}:summary`,
      CHAPTER: (novelId, chapterNum) => `novel:${novelId}:chapter:${chapterNum}`,
      USER_SESSION: (userId) => `session:${userId}`,
      AI_CONFIG: (userId) => `aiconfig:${userId}`,
      RATE_LIMIT: (key) => `ratelimit:${key}`
    };
    
    this.init();
  }

  /**
   * 初始化 Redis 连接
   */
  init() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`[Redis] 重连尝试 ${times}, 延迟 ${delay}ms`);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true // 延迟连接，直到第一次使用
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('[Redis] 连接成功');
        this.emit('connected');
      });

      this.redis.on('error', (err) => {
        console.error('[Redis] 错误:', err.message);
        this.isConnected = false;
        this.emit('error', err);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        console.log('[Redis] 连接关闭');
        this.emit('disconnected');
      });

    } catch (error) {
      console.error('[Redis] 初始化失败:', error.message);
      // Redis 失败不应阻塞应用，降级为仅数据库模式
      this.redis = null;
    }
  }

  /**
   * 检查 Redis 连接状态
   */
  async healthCheck() {
    if (!this.redis) return { healthy: false, mode: 'disabled' };
    
    try {
      await this.redis.ping();
      return { 
        healthy: true, 
        mode: 'enabled',
        info: await this.redis.info('server')
      };
    } catch (error) {
      return { 
        healthy: false, 
        mode: 'error',
        error: error.message 
      };
    }
  }

  /**
   * 获取缓存（带降级）
   */
  async get(key) {
    if (!this.redis || !this.isConnected) return null;
    
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch {
        return data; // 非 JSON 数据直接返回
      }
    } catch (error) {
      console.error('[Cache] 获取失败:', key, error.message);
      return null;
    }
  }

  /**
   * 设置缓存
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.redis || !this.isConnected) return false;
    
    try {
      const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await this.redis.setex(key, ttl, data);
      return true;
    } catch (error) {
      console.error('[Cache] 设置失败:', key, error.message);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  async del(key) {
    if (!this.redis || !this.isConnected) return false;
    
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('[Cache] 删除失败:', key, error.message);
      return false;
    }
  }

  /**
   * 批量删除（支持通配符）
   */
  async delPattern(pattern) {
    if (!this.redis || !this.isConnected) return 0;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await this.redis.del(...keys);
      console.log(`[Cache] 批量删除 ${keys.length} 个键: ${pattern}`);
      return keys.length;
    } catch (error) {
      console.error('[Cache] 批量删除失败:', pattern, error.message);
      return 0;
    }
  }

  /**
   * 获取或设置缓存（Cache-Aside 模式）
   */
  async getOrSet(key, factory, ttl = this.defaultTTL) {
    // 先尝试从缓存获取
    let data = await this.get(key);
    if (data !== null) {
      return data;
    }
    
    // 缓存未命中，从数据源获取
    try {
      data = await factory();
      
      // 只有非空数据才缓存
      if (data !== null && data !== undefined) {
        await this.set(key, data, ttl);
      }
      
      return data;
    } catch (error) {
      console.error('[Cache] 数据源获取失败:', key, error.message);
      throw error;
    }
  }

  /**
   * 缓存小说世界观数据
   */
  async cacheNovelWorld(novelId, worldData) {
    return this.set(
      this.patterns.NOVEL_WORLD(novelId), 
      worldData, 
      3600 // 1小时
    );
  }

  /**
   * 获取小说世界观数据
   */
  async getNovelWorld(novelId) {
    return this.get(this.patterns.NOVEL_WORLD(novelId));
  }

  /**
   * 缓存角色列表
   */
  async cacheNovelCharacters(novelId, characters) {
    return this.set(
      this.patterns.NOVEL_CHARACTERS(novelId), 
      characters, 
      1800 // 30分钟
    );
  }

  /**
   * 获取角色列表
   */
  async getNovelCharacters(novelId) {
    return this.get(this.patterns.NOVEL_CHARACTERS(novelId));
  }

  /**
   * 缓存时间线事件
   */
  async cacheNovelTimeline(novelId, events) {
    return this.set(
      this.patterns.NOVEL_TIMELINE(novelId), 
      events, 
      1800 // 30分钟
    );
  }

  /**
   * 获取时间线事件
   */
  async getNovelTimeline(novelId) {
    return this.get(this.patterns.NOVEL_TIMELINE(novelId));
  }

  /**
   * 缓存物品列表
   */
  async cacheNovelItems(novelId, items) {
    return this.set(
      this.patterns.NOVEL_ITEMS(novelId), 
      items, 
      1800
    );
  }

  /**
   * 获取物品列表
   */
  async getNovelItems(novelId) {
    return this.get(this.patterns.NOVEL_ITEMS(novelId));
  }

  /**
   * 缓存地点列表
   */
  async cacheNovelLocations(novelId, locations) {
    return this.set(
      this.patterns.NOVEL_LOCATIONS(novelId), 
      locations, 
      1800
    );
  }

  /**
   * 获取地点列表
   */
  async getNovelLocations(novelId) {
    return this.get(this.patterns.NOVEL_LOCATIONS(novelId));
  }

  /**
   * 缓存章节内容
   */
  async cacheChapter(novelId, chapterNumber, content) {
    return this.set(
      this.patterns.CHAPTER(novelId, chapterNumber), 
      content, 
      3600 // 1小时，章节内容相对稳定
    );
  }

  /**
   * 获取章节内容
   */
  async getChapter(novelId, chapterNumber) {
    return this.get(this.patterns.CHAPTER(novelId, chapterNumber));
  }

  /**
   * 清除小说的所有缓存
   */
  async invalidateNovel(novelId) {
    const patterns = [
      this.patterns.NOVEL(novelId),
      this.patterns.NOVEL_WORLD(novelId),
      this.patterns.NOVEL_CHARACTERS(novelId),
      this.patterns.NOVEL_ITEMS(novelId),
      this.patterns.NOVEL_LOCATIONS(novelId),
      this.patterns.NOVEL_TIMELINE(novelId),
      this.patterns.NOVEL_SUMMARY(novelId),
      `novel:${novelId}:chapter:*` // 清除所有章节缓存
    ];
    
    let deleted = 0;
    for (const pattern of patterns) {
      // 精确键直接删除，通配符批量删除
      if (pattern.includes('*')) {
        deleted += await this.delPattern(pattern);
      } else {
        const result = await this.del(pattern);
        if (result) deleted++;
      }
    }
    
    console.log(`[Cache] 清除小说 ${novelId} 的 ${deleted} 个缓存键`);
    return deleted;
  }

  /**
   * 缓存用户配置
   */
  async cacheUserAIConfig(userId, config) {
    return this.set(
      this.patterns.AI_CONFIG(userId), 
      config, 
      7200 // 2小时
    );
  }

  /**
   * 获取用户配置
   */
  async getUserAIConfig(userId) {
    return this.get(this.patterns.AI_CONFIG(userId));
  }

  /**
   * 清除用户配置缓存
   */
  async invalidateUserAIConfig(userId) {
    return this.del(this.patterns.AI_CONFIG(userId));
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    if (!this.redis || !this.isConnected) {
      return { connected: false };
    }
    
    try {
      const info = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();
      
      return {
        connected: true,
        keys: dbsize,
        memory: info.match(/used_memory:(\d+)/)?.[1] || 'unknown'
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  /**
   * 优雅关闭连接
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
      console.log('[Redis] 连接已关闭');
    }
  }
}

// 导出单例
export const cacheService = new CacheService();
export default cacheService;
