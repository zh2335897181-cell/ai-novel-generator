import dotenv from 'dotenv';
dotenv.config();

// JWT 密钥安全检查
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] 生产环境必须设置 JWT_SECRET 环境变量！');
    process.exit(1);
  }
  console.warn('==========================================');
  console.warn('[WARN] JWT_SECRET 未设置，使用开发环境默认值');
  console.warn('[WARN] 生产环境部署前务必设置 JWT_SECRET 环境变量');
  console.warn('==========================================');
  process.env.JWT_SECRET = 'dev-secret-change-in-production';
}

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from './config/database.js';
import routes from './routes/index.js';
import adminRoutes from './routes/admin.js';

// 简单的速率限制实现
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
    // 每5分钟清理过期记录，防止内存泄漏
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.requests) {
      if (now > record.resetTime) {
        this.requests.delete(ip);
      }
    }
  }

  middleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!this.requests.has(ip)) {
      this.requests.set(ip, { count: 1, resetTime: now + this.windowMs });
      return next();
    }

    const record = this.requests.get(ip);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + this.windowMs;
      return next();
    }

    if (record.count >= this.maxRequests) {
      return res.status(429).json({ message: '请求过于频繁，请稍后重试' });
    }

    record.count++;
    next();
  }
}

const limiter = new RateLimiter(100, 60000); // 每分钟100个请求

// API密钥认证中间件
const apiKeyAuth = async (req, res, next) => {
  // 调试日志
  console.log('[Auth Debug]', req.path, 'userId:', req.userId, 'isGuest:', req.headers['x-guest-mode'] === 'true');
  
  // 公开路由列表（使用 startsWith 精确匹配路径前缀）
  const publicPathPrefixes = ['/api/auth/', '/health', '/api/public/', '/api/reports', '/api/announcement', '/api/maintenance-status', '/api/admin/'];
  const isPublic = publicPathPrefixes.some(prefix => req.path.startsWith(prefix));
  
  if (isPublic) {
    return next();
  }
  
  // 检查 JWT token（用于 /auth/me 等需要认证的路由）
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;  // 服务端设置，不可伪造

      if (decoded.username === 'admin' || decoded.role === 'super_admin') {
        req.isSuperAdmin = true;
        console.log('[Auth Debug] Super admin detected, bypassing restrictions');
      }
      return next();
    } catch (error) {
      console.log('[Auth Debug] Invalid JWT token:', error.message);
      return res.status(401).json({ message: '无效的token' });
    }
  }

  // 游客模式：验证或创建独立的游客身份
  const isGuest = req.headers['x-guest-mode'] === 'true';

  if (isGuest) {
    const guestToken = req.headers['x-guest-token'];

    if (guestToken) {
      try {
        const decoded = jwt.verify(guestToken, process.env.JWT_SECRET);
        if (decoded.guestId) {
          req.userId = decoded.userId;
          req.isGuest = true;
          return next();
        }
      } catch {
        // Token过期或无效，重新生成
      }
    }

    // 创建新的独立游客用户
    try {
      const guestId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
      const [result] = await pool.query(
        'INSERT INTO user (username, password) VALUES (?, ?)',
        [`guest_${guestId}`, crypto.randomBytes(32).toString('hex')]
      );
      const userId = result.insertId;
      const token = jwt.sign(
        { userId, guestId, isGuest: true },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      req.userId = userId;
      req.isGuest = true;
      res.setHeader('x-guest-token', token);
      return next();
    } catch (err) {
      console.error('创建游客用户失败:', err);
      return res.status(500).json({ message: '服务异常，请重试' });
    }
  }

  // 既无有效token也不是游客模式 → 拒绝
  console.log('[Auth Debug] 401 - Missing auth');
  return res.status(401).json({ message: '未授权，请先登录' });
};

const app = express();

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const PORT = process.env.PORT || 8080;

// 中间件
// CORS: 生产环境限制来源，开发环境允许全部
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true }
  : { origin: true };
app.use(cors(corsOptions));

// CSRF 防护：检查状态变更请求的来源
app.use((req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!safeMethods.includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    // 简单检查：POST/PUT/DELETE 必须有 origin 或 referer
    if (!origin && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: '请求被拒绝：缺少来源验证' });
    }
  }
  next();
});
app.use(limiter.middleware.bind(limiter));
app.use(apiKeyAuth);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
// 管理员路由优先挂载，不受维护模式影响
app.use('/api/admin', adminRoutes);

// 判断设置值是否为"启用"（兼容 'true' 和 mysql2 布尔转数字 '1'）
function isSettingEnabled(value) {
  return value === 'true' || value === '1';
}

// 维护模式公开状态查询（不受维护模式拦截）
app.get('/api/maintenance-status', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` IN ('maintenance_mode', 'maintenance_estimated_end', 'maintenance_scheduled_enabled', 'maintenance_scheduled_time', 'maintenance_scheduled_end')"
    );
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    let maintenance = isSettingEnabled(settings.maintenance_mode);

    // 检查定时维护
    let scheduledActive = false;
    let scheduledTime = null;
    let scheduledEnd = null;
    if (!maintenance && isSettingEnabled(settings.maintenance_scheduled_enabled) && settings.maintenance_scheduled_time) {
      const now = new Date();
      const st = new Date(settings.maintenance_scheduled_time);
      if (!isNaN(st.getTime())) {
        scheduledTime = settings.maintenance_scheduled_time;
        scheduledEnd = settings.maintenance_scheduled_end || null;
        if (now >= st) {
          // 检查是否已过结束时间
          if (settings.maintenance_scheduled_end) {
            const et = new Date(settings.maintenance_scheduled_end);
            if (!isNaN(et.getTime()) && now < et) {
              maintenance = true;
              scheduledActive = true;
            }
          } else {
            maintenance = true;
            scheduledActive = true;
          }
        }
      }
    }

    res.json({
      maintenance,
      estimatedEnd: settings.maintenance_estimated_end || null,
      scheduled: {
        enabled: isSettingEnabled(settings.maintenance_scheduled_enabled),
        time: scheduledTime,
        end: scheduledEnd,
        active: scheduledActive
      }
    });
  } catch (err) {
    console.error('查询维护模式状态失败:', err.message);
    res.json({ maintenance: false, estimatedEnd: null, scheduled: { enabled: false, time: null, end: null, active: false } });
  }
});

// 站点公告公开查询（不受维护模式拦截）
app.get('/api/announcement', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` IN ('site_notice', 'site_notice_enabled', 'site_notice_type')"
    );
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    // 兼容旧数据：如果 site_notice_enabled 键不存在但有公告内容，默认视为启用
    const hasContent = settings.site_notice && settings.site_notice.trim();
    let enabled;
    if (settings.site_notice_enabled !== undefined) {
      enabled = isSettingEnabled(settings.site_notice_enabled);
    } else {
      enabled = !!hasContent;
    }
    res.json({
      success: true,
      data: {
        content: settings.site_notice || '',
        enabled,
        type: settings.site_notice_type || 'info'
      }
    });
  } catch (err) {
    console.error('获取公告失败:', err.message);
    res.json({ success: true, data: { content: '', enabled: false, type: 'info' } });
  }
});

// 维护模式中间件 — 拦截非管理员API请求
app.use('/api', async (req, res, next) => {
  // 登录和注册接口始终放行，确保管理员可以登录后台
  // 注意: req.path 是相对于挂载点 /api 的路径
  const publicPaths = ['/auth/login', '/auth/register', '/auth/me'];
  if (publicPaths.some(p => req.path === p)) return next();

  try {
    // 查询手动维护模式和定时维护设置
    const [rows] = await pool.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` IN ('maintenance_mode', 'maintenance_estimated_end', 'maintenance_scheduled_enabled', 'maintenance_scheduled_time', 'maintenance_scheduled_end')"
    );
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });

    // 手动开启 → 启用维护
    let maintenanceEnabled = isSettingEnabled(settings.maintenance_mode);

    // 定时维护：在时间窗口内自动开启
    if (!maintenanceEnabled && isSettingEnabled(settings.maintenance_scheduled_enabled) && settings.maintenance_scheduled_time) {
      const now = new Date();
      const startTime = new Date(settings.maintenance_scheduled_time);
      if (!isNaN(startTime.getTime()) && now >= startTime) {
        // 检查是否已过结束时间
        if (settings.maintenance_scheduled_end) {
          const endTime = new Date(settings.maintenance_scheduled_end);
          if (!isNaN(endTime.getTime()) && now < endTime) {
            maintenanceEnabled = true;
          }
        } else {
          maintenanceEnabled = true;
        }
      }
    }

    if (!maintenanceEnabled) return next();

    // 检查用户是否为管理员（优先使用 apiKeyAuth 已解析的 req.user）
    const isAdmin = (req.user?.role === 'admin' || req.user?.role === 'super_admin')
      || req.headers['x-admin-key'] === process.env.ADMIN_KEY;

    if (isAdmin) return next();

    res.status(503).json({
      success: false,
      message: '网站维护中，请稍后再试',
      maintenance: true
    });
  } catch (err) {
    console.error('维护模式检查失败:', err.message);
    next(); // 查询失败时放行，避免误拦
  }
});

// 主路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'ai-proxy' });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  const statusCode = err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : '服务器内部错误';
  res.status(statusCode).json({ 
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI代理服务器运行在 http://localhost:${PORT}`);
});
