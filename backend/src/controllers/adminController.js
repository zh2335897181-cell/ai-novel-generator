import pool from '../config/database.js';
import sensitiveWordService from '../services/sensitiveWordService.js';

class AdminController {
  // ==================== 数据统计 ====================
  
  // 获取仪表盘统计数据
  async getDashboardStats(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        // 用户统计
        const [userStats] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as today_new FROM user'
        );
        
        // 小说统计
        const [novelStats] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as today_new FROM novel'
        );
        
        // 章节统计
        const [chapterStats] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as today_new FROM content'
        );
        
        // 举报统计
        const [reportStats] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "pending" THEN 1 END) as pending, COUNT(CASE WHEN status = "resolved" THEN 1 END) as resolved FROM report'
        );
        
        // 审核统计
        const [reviewStats] = await conn.query(
          'SELECT COUNT(*) as total, COUNT(CASE WHEN status = "pending" THEN 1 END) as pending, COUNT(CASE WHEN status = "approved" THEN 1 END) as approved, COUNT(CASE WHEN status = "rejected" THEN 1 END) as rejected FROM content_review'
        );
        
        // 最近7天用户注册趋势
        const [userTrend] = await conn.query(
          `SELECT DATE(created_at) as date, COUNT(*) as count 
           FROM user 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
           GROUP BY DATE(created_at) 
           ORDER BY date ASC`
        );
        
        // 最近7天小说创建趋势
        const [novelTrend] = await conn.query(
          `SELECT DATE(created_at) as date, COUNT(*) as count 
           FROM novel 
           WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
           GROUP BY DATE(created_at) 
           ORDER BY date ASC`
        );

        res.json({
          success: true,
          data: {
            users: userStats[0],
            novels: novelStats[0],
            chapters: chapterStats[0],
            reports: reportStats[0],
            reviews: reviewStats[0],
            userTrend,
            novelTrend
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 用户管理 ====================
  
  // 获取用户列表
  async getUsers(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword = '', status = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        let whereClause = '1=1';
        const params = [];
        
        if (keyword) {
          whereClause += ' AND (u.username LIKE ? OR u.id = ?)';
          params.push(`%${keyword}%`, keyword);
        }
        
        if (status) {
          whereClause += ' AND u.status = ?';
          params.push(status);
        }
        
        const [users] = await conn.query(
          `SELECT u.id, u.username, u.status, u.role, u.created_at, u.last_login,
                  COALESCE(nc.novel_count, 0) as novel_count,
                  COALESCE(nc.chapter_count, 0) as chapter_count
           FROM user u
           LEFT JOIN (
             SELECT n.user_id,
                    COUNT(DISTINCT n.id) as novel_count,
                    COUNT(c.id) as chapter_count
             FROM novel n
             LEFT JOIN content c ON c.novel_id = n.id
             GROUP BY n.user_id
           ) nc ON nc.user_id = u.id
           WHERE ${whereClause}
           ORDER BY u.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM user u WHERE ${whereClause}`,
          params
        );
        
        res.json({
          success: true,
          data: {
            list: users,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新用户状态（封禁/解封）
  async updateUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { status, reason } = req.body;
      
      if (!['active', 'banned', 'muted'].includes(status)) {
        return res.status(400).json({ success: false, message: '无效的状态值' });
      }
      
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'UPDATE user SET status = ?, ban_reason = ? WHERE id = ?',
          [status, reason || null, userId]
        );
        
        // 记录操作日志
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'update_user_status', 'user', userId, JSON.stringify({ status, reason })]
        );
        
        res.json({ success: true, message: '用户状态已更新' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新用户角色
  async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { role, parentAdminId } = req.body;
      
      if (!['user', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ success: false, message: '无效的角色值' });
      }
      
      // 只有超级管理员可以创建/修改次管理员
      if (role === 'admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: '只有超级管理员可以授权次管理员' });
      }
      
      // 不能修改超级管理员
      if (role === 'super_admin' && req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: '不能修改超级管理员' });
      }
      
      const conn = await pool.getConnection();
      try {
        // 如果设置为次管理员，设置上级管理员ID
        if (role === 'admin' && parentAdminId) {
          await conn.query('UPDATE user SET role = ?, parent_admin_id = ? WHERE id = ?', [role, parentAdminId, userId]);
        } else {
          await conn.query('UPDATE user SET role = ?, parent_admin_id = NULL WHERE id = ?', [role, userId]);
        }
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'update_user_role', 'user', userId, JSON.stringify({ role, parentAdminId })]
        );
        
        res.json({ success: true, message: '用户角色已更新' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('更新用户角色失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取次管理员列表
  async getSubAdmins(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        // 只有超级管理员可以查看次管理员
        if (req.user?.role !== 'super_admin') {
          return res.status(403).json({ success: false, message: '权限不足' });
        }
        
        const [admins] = await conn.query(
          `SELECT u.*, p.username as parent_admin_name
           FROM user u
           LEFT JOIN user p ON u.parent_admin_id = p.id
           WHERE u.role = 'admin'
           ORDER BY u.created_at DESC
           LIMIT ? OFFSET ?`,
          [parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM user WHERE role = 'admin'`
        );
        
        res.json({
          success: true,
          data: {
            list: admins,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取次管理员列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 创建次管理员（通过邀请/授权）
  async createSubAdmin(req, res) {
    try {
      const { username, password } = req.body;
      
      // 只有超级管理员可以创建次管理员
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: '只有超级管理员可以创建次管理员' });
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
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(password, 10);
        
        // 创建次管理员，设置上级为当前超级管理员
        const [result] = await conn.query(
          'INSERT INTO user (username, password, role, status, parent_admin_id) VALUES (?, ?, ?, ?, ?)',
          [username, hashedPassword, 'admin', 'active', req.user?.userId]
        );
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId, 'create_sub_admin', 'user', result.insertId, JSON.stringify({ username })]
        );
        
        res.json({
          success: true,
          message: '次管理员创建成功',
          data: { id: result.insertId, username, role: 'admin' }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('创建次管理员失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 删除次管理员
  async deleteSubAdmin(req, res) {
    try {
      const { userId } = req.params;
      const conn = await pool.getConnection();
      
      try {
        // 只有超级管理员可以删除次管理员
        if (req.user?.role !== 'super_admin') {
          return res.status(403).json({ success: false, message: '权限不足' });
        }
        
        // 检查要删除的用户是否是次管理员
        const [users] = await conn.query('SELECT role FROM user WHERE id = ?', [userId]);
        if (users.length === 0) {
          return res.status(404).json({ success: false, message: '用户不存在' });
        }
        
        if (users[0].role !== 'admin') {
          return res.status(400).json({ success: false, message: '只能删除次管理员' });
        }
        
        // 删除用户
        await conn.query('DELETE FROM user WHERE id = ?', [userId]);
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId, 'delete_sub_admin', 'user', userId, '{}']
        );
        
        res.json({ success: true, message: '次管理员已删除' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('删除次管理员失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 删除用户
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const conn = await pool.getConnection();
      
      try {
        // 批量删除用户相关数据（使用 IN 子查询代替循环 N+1）
        await conn.query(
          'DELETE FROM content WHERE novel_id IN (SELECT id FROM novel WHERE user_id = ?)',
          [userId]
        );
        await conn.query(
          'DELETE FROM `character` WHERE novel_id IN (SELECT id FROM novel WHERE user_id = ?)',
          [userId]
        );
        await conn.query(
          'DELETE FROM world_state WHERE novel_id IN (SELECT id FROM novel WHERE user_id = ?)',
          [userId]
        );
        await conn.query('DELETE FROM content_review WHERE novel_id IN (SELECT id FROM novel WHERE user_id = ?)', [userId]);

        await conn.query('DELETE FROM novel WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM user WHERE id = ?', [userId]);
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'delete_user', 'user', userId, '{}']
        );
        
        res.json({ success: true, message: '用户已删除' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 内容审核 ====================
  
  // 获取待审核内容列表
  async getReviewList(req, res) {
    try {
      const { page = 1, pageSize = 20, status = 'pending', type = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        let whereClause = '1=1';
        const params = [];
        
        if (status) {
          whereClause += ' AND cr.status = ?';
          params.push(status);
        }
        
        if (type) {
          whereClause += ' AND cr.content_type = ?';
          params.push(type);
        }
        
        const [reviews] = await conn.query(
          `SELECT cr.*, u.username as author_name, n.title as novel_title
           FROM content_review cr
           LEFT JOIN user u ON cr.user_id = u.id
           LEFT JOIN novel n ON cr.novel_id = n.id
           WHERE ${whereClause}
           ORDER BY cr.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM content_review cr WHERE ${whereClause}`,
          params
        );
        
        res.json({
          success: true,
          data: {
            list: reviews,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取审核列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 审核内容（通过/拒绝）
  async reviewContent(req, res) {
    try {
      const { reviewId } = req.params;
      const { status, reason } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: '无效的审核状态' });
      }
      
      const conn = await pool.getConnection();
      try {
        // 获取审核内容信息
        const [reviews] = await conn.query('SELECT * FROM content_review WHERE id = ?', [reviewId]);
        if (reviews.length === 0) {
          return res.status(404).json({ success: false, message: '审核记录不存在' });
        }
        
        const review = reviews[0];
        
        // 更新审核状态
        await conn.query(
          'UPDATE content_review SET status = ?, reason = ?, reviewer_id = ?, reviewed_at = NOW() WHERE id = ?',
          [status, reason || null, req.user?.userId || 0, reviewId]
        );
        
        // 如果拒绝，标记相关内容
        if (status === 'rejected' && review.content_type === 'novel') {
          await conn.query('UPDATE novel SET status = ?, is_published = 0 WHERE id = ?', ['blocked', review.novel_id]);
        } else if (status === 'rejected' && review.content_type === 'chapter') {
          await conn.query('UPDATE story_content SET review_status = ? WHERE id = ?', ['rejected', review.content_id]);
        } else if (status === 'approved' && review.content_type === 'novel') {
          // 小说审核通过后恢复为active
          await conn.query('UPDATE novel SET status = ? WHERE id = ?', ['active', review.novel_id]);
        } else if (status === 'approved' && review.content_type === 'chapter') {
          await conn.query('UPDATE story_content SET review_status = ? WHERE id = ?', ['approved', review.content_id]);
        }
        
        // 记录操作日志
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'review_content', 'review', reviewId, JSON.stringify({ status, reason })]
        );
        
        res.json({ success: true, message: `内容已${status === 'approved' ? '通过' : '拒绝'}审核` });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('审核内容失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 提交内容到审核队列
  async submitForReview(req, res) {
    try {
      const { contentType, contentId, novelId, content, userId } = req.body;
      
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'INSERT INTO content_review (content_type, content_id, novel_id, content, user_id, status) VALUES (?, ?, ?, ?, ?, ?)',
          [contentType, contentId, novelId, content, userId, 'pending']
        );
        
        res.json({ success: true, message: '已提交审核' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('提交审核失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // AI 辅助检测审核内容
  async aiCheckReview(req, res) {
    try {
      const { reviewId } = req.params;
      const conn = await pool.getConnection();

      try {
        const [reviews] = await conn.query('SELECT * FROM content_review WHERE id = ?', [reviewId]);
        if (reviews.length === 0) {
          return res.status(404).json({ success: false, message: '审核记录不存在' });
        }

        const review = reviews[0];
        const content = review.content || '';

        if (!content.trim()) {
          return res.status(400).json({ success: false, message: '审核内容为空' });
        }

        const apiKey = process.env.AI_API_KEY;
        const baseURL = process.env.AI_BASE_URL || 'https://api.deepseek.com/v1';
        const model = process.env.AI_MODEL || 'deepseek-chat';

        if (!apiKey || apiKey === 'your-api-key-here') {
          return res.status(400).json({ success: false, message: '请先配置 AI API Key' });
        }

        const systemPrompt = `你是一个专业的内容审核助手。请对以下用户提交的小说内容进行审核，检查是否存在以下问题：
1. 违法违规内容（色情、暴力、恐怖主义、分裂国家等）
2. 人身攻击、辱骂、歧视言论
3. 垃圾广告、恶意推广
4. 侵犯他人隐私
5. 其他不适合发布的内容

请按以下格式输出审核结果：
【审核结论】：通过 / 需人工复核 / 违规
【风险等级】：低 / 中 / 高
【问题类型】：（如有）列出具体问题类型
【详细说明】：（如有）简要说明问题所在
【建议处理】：给出处理建议`;

        const response = await fetch(`${baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请审核以下内容：\n\n${content.substring(0, 8000)}` }
            ],
            temperature: 0.1,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error?.message || `AI API错误: ${response.status}`);
        }

        const data = await response.json();
        const aiResult = data.choices[0].message.content;

        res.json({ success: true, data: { result: aiResult } });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('AI审核检测失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 举报管理 ====================
  
  // 获取举报列表
  async getReports(req, res) {
    try {
      const { page = 1, pageSize = 20, status = '', type = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        let whereClause = '1=1';
        const params = [];
        
        if (status) {
          whereClause += ' AND r.status = ?';
          params.push(status);
        }
        
        if (type) {
          whereClause += ' AND r.type = ?';
          params.push(type);
        }
        
        const [reports] = await conn.query(
          `SELECT r.*, u1.username as reporter_name, u2.username as target_user_name, n.title as novel_title
           FROM report r
           LEFT JOIN user u1 ON r.reporter_id = u1.id
           LEFT JOIN user u2 ON r.target_user_id = u2.id
           LEFT JOIN novel n ON r.novel_id = n.id
           WHERE ${whereClause}
           ORDER BY r.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM report r WHERE ${whereClause}`,
          params
        );
        
        res.json({
          success: true,
          data: {
            list: reports,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取举报列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 处理举报
  async handleReport(req, res) {
    try {
      const { reportId } = req.params;
      const { status, action, reason } = req.body;
      
      if (!['resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, message: '无效的处理状态' });
      }
      
      const conn = await pool.getConnection();
      try {
        // 获取举报信息
        const [reports] = await conn.query('SELECT * FROM report WHERE id = ?', [reportId]);
        if (reports.length === 0) {
          return res.status(404).json({ success: false, message: '举报不存在' });
        }
        
        const report = reports[0];
        
        // 更新举报状态
        await conn.query(
          'UPDATE report SET status = ?, handler_id = ?, handle_result = ?, handled_at = NOW() WHERE id = ?',
          [status, req.user?.userId || 0, reason || null, reportId]
        );
        
        // 根据处理动作执行操作
        if (action === 'ban_user' && report.target_user_id) {
          await conn.query('UPDATE user SET status = ?, ban_reason = ? WHERE id = ?', ['banned', reason, report.target_user_id]);
        } else if (action === 'block_content' && report.novel_id) {
          await conn.query('UPDATE novel SET status = ? WHERE id = ?', ['blocked', report.novel_id]);
        } else if (action === 'block_chapter' && report.content_id) {
          await conn.query('UPDATE content SET status = ? WHERE id = ?', ['blocked', report.content_id]);
        }
        
        // 记录操作日志
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'handle_report', 'report', reportId, JSON.stringify({ status, action, reason })]
        );
        
        res.json({ success: true, message: '举报已处理' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('处理举报失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 创建举报
  async createReport(req, res) {
    try {
      const { type, targetUserId, novelId, contentId, reason, reporterId } = req.body;
      
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'INSERT INTO report (type, reporter_id, target_user_id, novel_id, content_id, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [type, reporterId, targetUserId || null, novelId || null, contentId || null, reason, 'pending']
        );
        
        res.json({ success: true, message: '举报已提交' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('创建举报失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 小说管理 ====================
  
  // 获取所有小说列表（管理视角）
  async getNovels(req, res) {
    try {
      const { page = 1, pageSize = 20, keyword = '', status = '', userId = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        let whereClause = '1=1';
        const params = [];
        
        if (keyword) {
          whereClause += ' AND (n.title LIKE ? OR n.id = ?)';
          params.push(`%${keyword}%`, keyword);
        }
        
        if (status) {
          whereClause += ' AND n.status = ?';
          params.push(status);
        }
        
        if (userId) {
          whereClause += ' AND n.user_id = ?';
          params.push(userId);
        }
        
        const [novels] = await conn.query(
          `SELECT n.*, u.username as author_name,
                  (SELECT COUNT(*) FROM content WHERE novel_id = n.id) as chapter_count
           FROM novel n
           LEFT JOIN user u ON n.user_id = u.id
           WHERE ${whereClause}
           ORDER BY n.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM novel n WHERE ${whereClause}`,
          params
        );
        
        res.json({
          success: true,
          data: {
            list: novels,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取小说列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新小说状态
  async updateNovelStatus(req, res) {
    try {
      const { novelId } = req.params;
      const { status, reason } = req.body;
      
      if (!['active', 'blocked', 'reviewing'].includes(status)) {
        return res.status(400).json({ success: false, message: '无效的状态值' });
      }
      
      const conn = await pool.getConnection();
      try {
        await conn.query('UPDATE novel SET status = ? WHERE id = ?', [status, novelId]);
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'update_novel_status', 'novel', novelId, JSON.stringify({ status, reason })]
        );
        
        res.json({ success: true, message: '小说状态已更新' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('更新小说状态失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 获取小说详情（含章节内容）
  async getNovelDetail(req, res) {
    try {
      const { novelId } = req.params;
      const conn = await pool.getConnection();
      
      try {
        const [novels] = await conn.query(
          `SELECT n.*, u.username as author_name, u.status as author_status
           FROM novel n
           LEFT JOIN user u ON n.user_id = u.id
           WHERE n.id = ?`,
          [novelId]
        );
        
        if (novels.length === 0) {
          return res.status(404).json({ success: false, message: '小说不存在' });
        }
        
        const [chapters] = await conn.query(
          'SELECT * FROM content WHERE novel_id = ? ORDER BY chapter_number ASC',
          [novelId]
        );
        
        const [characters] = await conn.query(
          'SELECT * FROM `character` WHERE novel_id = ?',
          [novelId]
        );
        
        const [worldState] = await conn.query(
          'SELECT * FROM world_state WHERE novel_id = ?',
          [novelId]
        );
        
        res.json({
          success: true,
          data: {
            novel: novels[0],
            chapters,
            characters,
            worldState: worldState[0] || null
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取小说详情失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 删除小说
  async deleteNovel(req, res) {
    try {
      const { novelId } = req.params;
      const conn = await pool.getConnection();
      
      try {
        await conn.query('DELETE FROM content WHERE novel_id = ?', [novelId]);
        await conn.query('DELETE FROM `character` WHERE novel_id = ?', [novelId]);
        await conn.query('DELETE FROM world_state WHERE novel_id = ?', [novelId]);
        await conn.query('DELETE FROM content_review WHERE novel_id = ?', [novelId]);
        await conn.query('DELETE FROM novel WHERE id = ?', [novelId]);
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'delete_novel', 'novel', novelId, '{}']
        );
        
        res.json({ success: true, message: '小说已删除' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('删除小说失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 操作日志 ====================
  
  // 获取操作日志
  async getLogs(req, res) {
    try {
      const { page = 1, pageSize = 20, action = '', targetType = '' } = req.query;
      const offset = (page - 1) * pageSize;
      const conn = await pool.getConnection();
      
      try {
        let whereClause = '1=1';
        const params = [];
        
        if (action) {
          whereClause += ' AND al.action = ?';
          params.push(action);
        }
        
        if (targetType) {
          whereClause += ' AND al.target_type = ?';
          params.push(targetType);
        }
        
        const [logs] = await conn.query(
          `SELECT al.*, u.username as admin_name
           FROM admin_log al
           LEFT JOIN user u ON al.admin_id = u.id
           WHERE ${whereClause}
           ORDER BY al.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, parseInt(pageSize), offset]
        );
        
        const [total] = await conn.query(
          `SELECT COUNT(*) as count FROM admin_log al WHERE ${whereClause}`,
          params
        );
        
        res.json({
          success: true,
          data: {
            list: logs,
            total: total[0].count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取操作日志失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 系统设置 ====================
  
  // 获取系统设置
  async getSettings(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        const [settings] = await conn.query('SELECT * FROM system_settings');
        
        const settingsMap = {};
        settings.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        
        res.json({ success: true, data: settingsMap });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取系统设置失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // 更新系统设置
  async updateSettings(req, res) {
    try {
      const { settings } = req.body;
      const conn = await pool.getConnection();
      
      try {
        for (const [key, value] of Object.entries(settings)) {
          await conn.query(
            'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
            [key, value, value]
          );
        }
        
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [req.user?.userId || 0, 'update_settings', 'system', 0, JSON.stringify(settings)]
        );
        
        res.json({ success: true, message: '设置已更新' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('更新系统设置失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 数据库初始化 ====================
  
  // 初始化审核相关表
  async initTables(req, res) {
    try {
      const conn = await pool.getConnection();
      
      try {
        // 用户表添加审核字段
        await conn.query(`ALTER TABLE user ADD COLUMN IF NOT EXISTS status ENUM('active', 'banned', 'muted') DEFAULT 'active'`);
        await conn.query(`ALTER TABLE user ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user'`);
        await conn.query(`ALTER TABLE user ADD COLUMN IF NOT EXISTS ban_reason TEXT`);
        await conn.query(`ALTER TABLE user ADD COLUMN IF NOT EXISTS last_login DATETIME`);
        
        // 小说表添加状态字段
        await conn.query(`ALTER TABLE novel ADD COLUMN IF NOT EXISTS status ENUM('active', 'blocked', 'reviewing') DEFAULT 'active'`);
        
        // 章节表添加状态字段
        await conn.query(`ALTER TABLE content ADD COLUMN IF NOT EXISTS status ENUM('active', 'blocked', 'reviewing') DEFAULT 'active'`);
        
        // 内容审核表
        await conn.query(`
          CREATE TABLE IF NOT EXISTS content_review (
            id INT AUTO_INCREMENT PRIMARY KEY,
            content_type ENUM('novel', 'chapter', 'character', 'world') NOT NULL,
            content_id INT,
            novel_id INT,
            content LONGTEXT,
            user_id INT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            reason TEXT,
            reviewer_id INT,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_content_type (content_type),
            INDEX idx_novel_id (novel_id)
          )
        `);
        
        // 举报表
        await conn.query(`
          CREATE TABLE IF NOT EXISTS report (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type ENUM('novel', 'chapter', 'user', 'other') NOT NULL,
            reporter_id INT,
            target_user_id INT,
            novel_id INT,
            content_id INT,
            reason TEXT NOT NULL,
            status ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending',
            handler_id INT,
            handle_result TEXT,
            handled_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_type (type)
          )
        `);
        
        // 管理员操作日志表
        await conn.query(`
          CREATE TABLE IF NOT EXISTS admin_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_id INT,
            action VARCHAR(100) NOT NULL,
            target_type VARCHAR(50),
            target_id INT,
            detail JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_action (action),
            INDEX idx_target (target_type, target_id)
          )
        `);
        
        // 系统设置表
        await conn.query(`
          CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`key\` VARCHAR(100) UNIQUE NOT NULL,
            \`value\` TEXT,
            description VARCHAR(255),
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        // 插入默认设置
        await conn.query(`
          INSERT IGNORE INTO system_settings (\`key\`, \`value\`, description) VALUES
          ('auto_review', 'false', '自动审核开关'),
          ('sensitive_words', '', '敏感词列表，逗号分隔'),
          ('max_novels_per_user', '50', '每用户最大小说数'),
          ('max_chapters_per_novel', '500', '每小说最大章节数'),
          ('guest_time_limit', '10', '游客使用时间限制(分钟)'),
          ('maintenance_mode', 'false', '维护模式开关'),
          ('site_notice', '', '站点公告')
        `);
        
        res.json({ success: true, message: '审核系统表初始化完成' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('初始化表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 受信任设备管理 ====================

  async getDevices(req, res) {
    try {
      const conn = await pool.getConnection();
      try {
        const userId = req.user?.userId;
        if (!userId) {
          return res.status(403).json({ success: false, message: '未授权' });
        }
        const [devices] = await conn.query(
          'SELECT id, device_id, device_name, ip_address, is_trusted, last_used, created_at FROM admin_device WHERE user_id = ? ORDER BY last_used DESC',
          [userId]
        );
        res.json({ success: true, data: devices });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async revokeDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const conn = await pool.getConnection();
      try {
        const userId = req.user?.userId;
        await conn.query(
          'DELETE FROM admin_device WHERE id = ? AND user_id = ?',
          [deviceId, userId]
        );
        await conn.query(
          'INSERT INTO admin_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)',
          [userId, 'revoke_device', 'device', deviceId, '{}']
        );
        res.json({ success: true, message: '设备已撤销' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('撤销设备失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 邀请码管理 ====================

  async getInviteCodes(req, res) {
    try {
      const { page = 1, pageSize = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const conn = await pool.getConnection();
      try {
        const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM invite_codes');
        const [list] = await conn.query(
          `SELECT ic.*, u.username as creator_name FROM invite_codes ic
           LEFT JOIN user u ON ic.created_by = u.id
           ORDER BY ic.created_at DESC LIMIT ? OFFSET ?`,
          [parseInt(pageSize), offset]
        );
        res.json({ success: true, data: { list, total } });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('获取邀请码列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async generateInviteCodes(req, res) {
    try {
      const { count = 5, maxUses = 1, expiresAt } = req.body;
      const userId = req.user.userId;
      const codes = [];
      const conn = await pool.getConnection();
      try {
        for (let i = 0; i < count; i++) {
          const code = 'INV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
          await conn.query(
            'INSERT INTO invite_codes (code, created_by, max_uses, expires_at) VALUES (?, ?, ?, ?)',
            [code, userId, maxUses, expiresAt || null]
          );
          codes.push(code);
        }
        res.json({ success: true, message: `成功生成 ${count} 个邀请码`, data: { codes } });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('生成邀请码失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateInviteCode(req, res) {
    try {
      const { codeId } = req.params;
      const { isActive, maxUses } = req.body;
      const conn = await pool.getConnection();
      try {
        const updates = [];
        const params = [];
        if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
        if (maxUses !== undefined) { updates.push('max_uses = ?'); params.push(maxUses); }
        if (updates.length === 0) {
          return res.status(400).json({ success: false, message: '没有需要更新的字段' });
        }
        params.push(codeId);
        await conn.query(`UPDATE invite_codes SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true, message: '邀请码已更新' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('更新邀请码失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteInviteCode(req, res) {
    try {
      const { codeId } = req.params;
      const conn = await pool.getConnection();
      try {
        await conn.query('DELETE FROM invite_codes WHERE id = ?', [codeId]);
        res.json({ success: true, message: '邀请码已删除' });
      } finally {
        conn.release();
      }
    } catch (error) {
      console.error('删除邀请码失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ==================== 敏感词管理 ====================

  async getSensitiveWords(req, res) {
    try {
      const { page = 1, pageSize = 50, search } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      let where = '1=1';
      const params = [];
      if (search) {
        where = 'word LIKE ?';
        params.push(`%${search}%`);
      }

      const [rows] = await pool.query(
        `SELECT * FROM sensitive_words WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, parseInt(pageSize), offset]
      );
      const [total] = await pool.query(
        `SELECT COUNT(*) as total FROM sensitive_words WHERE ${where}`,
        params
      );

      res.json({ success: true, list: rows, total: total[0].total });
    } catch (error) {
      console.error('获取敏感词列表失败:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addSensitiveWord(req, res) {
    try {
      const { word, severity = 'medium', replacement } = req.body;
      if (!word || !word.trim()) {
        return res.status(400).json({ success: false, message: '敏感词不能为空' });
      }
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'INSERT INTO sensitive_words (word, severity, replacement, created_by) VALUES (?, ?, ?, ?)',
          [word.trim(), severity, replacement || null, req.user?.userId || 0]
        );
        sensitiveWordService.invalidateCache();
        res.json({ success: true, message: '敏感词已添加' });
      } finally {
        conn.release();
      }
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: '该敏感词已存在' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async batchImportWords(req, res) {
    try {
      const { words } = req.body;
      if (!Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ success: false, message: '请提供敏感词数组' });
      }
      const conn = await pool.getConnection();
      try {
        let added = 0, skipped = 0;
        for (const item of words) {
          const w = typeof item === 'string' ? { word: item, severity: 'medium' } : item;
          if (!w.word) continue;
          try {
            await conn.query(
              'INSERT INTO sensitive_words (word, severity, replacement, created_by) VALUES (?, ?, ?, ?)',
              [w.word.trim(), w.severity || 'medium', w.replacement || null, req.user?.userId || 0]
            );
            added++;
          } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') skipped++;
            else throw e;
          }
        }
        sensitiveWordService.invalidateCache();
        res.json({ success: true, message: `成功添加 ${added} 个，跳过 ${skipped} 个（已存在）` });
      } finally {
        conn.release();
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateSensitiveWord(req, res) {
    try {
      const { wordId } = req.params;
      const { word, severity, replacement, is_active } = req.body;
      const updates = [];
      const params = [];

      if (word !== undefined) { updates.push('word = ?'); params.push(word.trim()); }
      if (severity !== undefined) { updates.push('severity = ?'); params.push(severity); }
      if (replacement !== undefined) { updates.push('replacement = ?'); params.push(replacement || null); }
      if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: '没有需要更新的字段' });
      }

      params.push(wordId);
      await pool.query(
        `UPDATE sensitive_words SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      sensitiveWordService.invalidateCache();
      res.json({ success: true, message: '敏感词已更新' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: '该敏感词已存在' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteSensitiveWord(req, res) {
    try {
      const { wordId } = req.params;
      await pool.query('DELETE FROM sensitive_words WHERE id = ?', [wordId]);
      sensitiveWordService.invalidateCache();
      res.json({ success: true, message: '敏感词已删除' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async testSensitiveWords(req, res) {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ success: false, message: '请输入测试文本' });
      }
      const result = await sensitiveWordService.testFilter(text);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new AdminController();
