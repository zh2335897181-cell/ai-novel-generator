import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthController {
  // 用户注册
  async register(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码长度至少6位' });
      }
      
      const conn = await pool.getConnection();
      
      try {
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
        
        // 生成JWT token
        const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
          success: true,
          message: '注册成功',
          token,
          user: { id: userId, username }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  // 用户登录
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      }
      
      const conn = await pool.getConnection();
      
      try {
        // 查找用户
        const [users] = await conn.query(
          'SELECT id, username, password FROM user WHERE username = ?',
          [username]
        );
        
        if (users.length === 0) {
          return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
        
        const user = users[0];
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }
        
        // 生成JWT token
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        res.json({
          success: true,
          message: '登录成功',
          token,
          user: { id: user.id, username: user.username }
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
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '未授权' });
      }
      
      const token = authHeader.substring(7);
      
      // 验证token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const conn = await pool.getConnection();
      
      try {
        const [users] = await conn.query(
          'SELECT id, username, created_at FROM user WHERE id = ?',
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
