import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT_SECRET 已由 index.js 启动时检查，此处直接读取即可
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

class AuthController {
  // 用户注册
  async register(req, res) {
    try {
      const { username, password, inviteCode } = req.body;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少6位' });
      }

      const conn = await pool.getConnection();

      try {
        // 检查是否开启邀请码注册模式
        const [settings] = await conn.query(
          "SELECT `value` FROM system_settings WHERE `key` = 'invite_only'"
        );
        const inviteOnly = settings.length > 0 && (settings[0].value === 'true' || settings[0].value === '1');

        if (inviteOnly) {
          if (!inviteCode) {
            return res.status(400).json({ success: false, message: '当前仅支持邀请码注册，请输入邀请码' });
          }
          // 验证邀请码
          const [codes] = await conn.query(
            'SELECT id, max_uses, current_uses, expires_at, is_active FROM invite_codes WHERE code = ?',
            [inviteCode]
          );
          if (codes.length === 0) {
            return res.status(400).json({ success: false, message: '邀请码无效' });
          }
          const code = codes[0];
          if (!code.is_active) {
            return res.status(400).json({ success: false, message: '邀请码已失效' });
          }
          if (code.expires_at && new Date(code.expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: '邀请码已过期' });
          }
          if (code.current_uses >= code.max_uses) {
            return res.status(400).json({ success: false, message: '邀请码已被使用完' });
          }
        }

        // 检查用户名是否已存在
        const [existingUsers] = await conn.query(
          'SELECT id FROM user WHERE username = ?',
          [username]
        );
        
        if (existingUsers.length > 0) {
          return res.status(400).json({ success: false, message: '用户名已存在' });
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 创建用户
        const [result] = await conn.query(
          'INSERT INTO user (username, password) VALUES (?, ?)',
          [username, hashedPassword]
        );
        
        const userId = result.insertId;

        // 如果使用了邀请码，增加使用次数
        if (inviteCode) {
          await conn.query(
            'UPDATE invite_codes SET current_uses = current_uses + 1 WHERE code = ?',
            [inviteCode]
          );
        }

        // 生成JWT token
        const token = jwt.sign({ userId, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
          success: true,
          message: '注册成功',
          token,
          user: { id: userId, username, role: 'user' }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 用户登录（含暴力破解防护 + 超管二次验证）
  async login(req, res) {
    try {
      const { username, password, adminCode } = req.body;
      const MAX_FAILED = 5;
      const LOCK_MINUTES = 30;

      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }

      const conn = await pool.getConnection();

      try {
        // 查找用户（含状态和安全信息）
        const [users] = await conn.query(
          'SELECT id, username, password, role, status, ban_reason, failed_attempts, locked_until, permissions FROM user WHERE username = ?',
          [username]
        );

        // 用户不存在 — 不暴露信息，统一返回错误
        if (users.length === 0) {
          return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        const user = users[0];

        // 检查账号是否被封禁
        if (user.status === 'banned') {
          const reason = user.ban_reason ? `原因：${user.ban_reason}` : '';
          return res.status(403).json({
            success: false,
            message: `您的账号已被封禁，无法登录。${reason}`,
            banned: true
          });
        }

        // 检查是否处于锁定状态
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
          return res.status(429).json({
            success: false,
            message: `账号已被临时锁定，请 ${remaining} 分钟后再试`,
            locked: true
          });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          // 增加失败计数，超过阈值则锁定
          const newCount = (user.failed_attempts || 0) + 1;
          if (newCount >= MAX_FAILED) {
            const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            await conn.query(
              'UPDATE user SET failed_attempts = ?, locked_until = ? WHERE id = ?',
              [newCount, lockUntil, user.id]
            );
            return res.status(429).json({
              success: false,
              message: `密码连续错误 ${newCount} 次，账号已锁定 ${LOCK_MINUTES} 分钟`,
              locked: true
            });
          }
          await conn.query(
            'UPDATE user SET failed_attempts = ? WHERE id = ?',
            [newCount, user.id]
          );
          return res.status(401).json({
            success: false,
            message: `用户名或密码错误（还剩 ${MAX_FAILED - newCount} 次机会）`
          });
        }

        // 密码正确 — 超管需二次验证（受信任设备可跳过）
        if (user.role === 'super_admin' && process.env.ADMIN_2FA_KEY) {
          const { deviceId, deviceName } = req.body;
          const clientIP = req.ip || req.connection.remoteAddress;
          const userAgent = req.headers['user-agent'] || '';

          // 检查是否为受信任设备
          let isTrusted = false;
          if (deviceId) {
            const [devices] = await conn.query(
              'SELECT id, is_trusted FROM admin_device WHERE user_id = ? AND device_id = ?',
              [user.id, deviceId]
            );
            if (devices.length > 0 && devices[0].is_trusted === 1) {
              isTrusted = true;
              // 更新最后使用时间
              await conn.query(
                'UPDATE admin_device SET last_used = NOW(), ip_address = ? WHERE id = ?',
                [clientIP, devices[0].id]
              );
            }
          }

          if (!isTrusted) {
            // 非受信任设备，需要安全码
            if (!adminCode || adminCode !== process.env.ADMIN_2FA_KEY) {
              return res.status(403).json({
                success: false,
                message: '当前设备未受信任，请输入管理员安全码',
                requireAdminCode: true
              });
            }
            // 安全码正确，注册当前设备为受信任设备
            if (deviceId) {
              await conn.query(
                `INSERT INTO admin_device (user_id, device_id, device_name, ip_address, user_agent, is_trusted)
                 VALUES (?, ?, ?, ?, ?, 1)
                 ON DUPLICATE KEY UPDATE is_trusted = 1, last_used = NOW(), device_name = VALUES(device_name)`,
                [user.id, deviceId, deviceName || '未知设备', clientIP, userAgent]
              );
            }
          }
        }

        // 登录成功，清除失败记录
        await conn.query(
          'UPDATE user SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
          [user.id]
        );

        // 解析子管理员权限
        let permissions = [];
        if (user.permissions) {
          try { permissions = JSON.parse(user.permissions); } catch (_) { permissions = []; }
        }

        // 生成JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username, role: user.role || 'user', permissions },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          success: true,
          message: '登录成功',
          token,
          user: { id: user.id, username: user.username, role: user.role || 'user', permissions },
          isSuperAdmin: user.role === 'super_admin',
          isAdmin: user.role === 'admin'
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 获取当前用户信息
  async getMe(req, res) {
    try {
      // 游客模式：中间件已设置 req.userId
      if (req.isGuest && req.userId) {
        return res.json({
          success: true,
          user: { id: req.userId, username: '游客', role: 'guest' }
        });
      }

      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '未授权' });
      }

      if (!JWT_SECRET) {
        return res.status(500).json({ success: false, message: '服务器配置错误' });
      }

      const token = authHeader.substring(7);

      // 验证token
      const decoded = jwt.verify(token, JWT_SECRET);

      const conn = await pool.getConnection();

      try {
        const [users] = await conn.query(
          'SELECT id, username, role, status, created_at FROM user WHERE id = ?',
          [decoded.userId]
        );
        
        if (users.length === 0) {
          return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        res.json({
          success: true,
          user: users[0]
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: '无效的token' });
      }
      console.error('获取用户信息失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AuthController();
