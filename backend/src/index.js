import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';

// 简单的速率限制实现
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
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
const apiKeyAuth = (req, res, next) => {
  // 公开路由列表
  const publicRoutes = ['/auth/register', '/auth/login', '/health'];
  const isPublic = publicRoutes.some(route => req.path.includes(route));
  
  if (isPublic) {
    return next();
  }
  
  // 简化版：检查用户ID或游客模式
  const userId = req.headers['user-id'];
  const isGuest = req.headers['x-guest-mode'] === 'true';
  
  if (!userId && !isGuest) {
    return res.status(401).json({ message: '未授权，请先登录' });
  }
  
  // 游客模式使用默认用户ID
  if (isGuest && !userId) {
    req.headers['user-id'] = '1';
  }
  
  next();
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(limiter.middleware.bind(limiter));
app.use(apiKeyAuth);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
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
