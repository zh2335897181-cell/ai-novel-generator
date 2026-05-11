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
  
  // 公开路由列表
  const publicRoutes = ['/auth/register', '/auth/login', '/health', '/admin', '/public/'];
  const isPublic = publicRoutes.some(route => req.path.includes(route));
  
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
app.use('/api', routes);
app.use('/api/admin', adminRoutes);

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
