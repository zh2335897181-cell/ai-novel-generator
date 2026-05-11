import express from 'express';
import adminController from '../controllers/adminController.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 管理员权限验证中间件
const adminAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminKey = req.headers['x-admin-key'];

    // 方式1: JWT token 验证（登录管理员）
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('[Admin Auth] JWT_SECRET 未配置，无法验证token');
        return res.status(500).json({ success: false, message: '服务器配置错误' });
      }
      const decoded = jwt.verify(token, JWT_SECRET);

      // 检查是否是管理员角色（包括超级管理员和次管理员）
      if (decoded.role === 'admin' || decoded.role === 'super_admin') {
        req.user = decoded;
        return next();
      }
    }

    // 方式2: 管理员密钥验证（初始设置用）
    if (adminKey && process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY) {
      req.user = { userId: 0, username: 'system', role: 'super_admin' };
      return next();
    }

    return res.status(403).json({ success: false, message: '需要管理员权限' });
  } catch (error) {
    return res.status(403).json({ success: false, message: '权限验证失败' });
  }
};

// 所有管理员路由都需要权限验证
router.use(adminAuth);

// 数据库初始化
router.post('/init', adminController.initTables);

// 仪表盘统计
router.get('/dashboard', adminController.getDashboardStats);

// 用户管理
router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// 次管理员管理
router.get('/sub-admins', adminController.getSubAdmins);
router.post('/sub-admins', adminController.createSubAdmin);
router.delete('/sub-admins/:userId', adminController.deleteSubAdmin);

// 内容审核
router.get('/reviews', adminController.getReviewList);
router.post('/reviews', adminController.submitForReview);
router.put('/reviews/:reviewId', adminController.reviewContent);
router.post('/reviews/:reviewId/ai-check', adminController.aiCheckReview);

// 举报管理
router.get('/reports', adminController.getReports);
router.post('/reports', adminController.createReport);
router.put('/reports/:reportId', adminController.handleReport);

// 小说管理
router.get('/novels', adminController.getNovels);
router.get('/novels/:novelId', adminController.getNovelDetail);
router.put('/novels/:novelId/status', adminController.updateNovelStatus);
router.delete('/novels/:novelId', adminController.deleteNovel);

// 操作日志
router.get('/logs', adminController.getLogs);

// 系统设置
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// 受信任设备管理
router.get('/devices', adminController.getDevices);
router.delete('/devices/:deviceId', adminController.revokeDevice);

// 邀请码管理
router.get('/invite-codes', adminController.getInviteCodes);
router.post('/invite-codes', adminController.generateInviteCodes);
router.put('/invite-codes/:codeId', adminController.updateInviteCode);
router.delete('/invite-codes/:codeId', adminController.deleteInviteCode);

// 敏感词管理
router.get('/sensitive-words', adminController.getSensitiveWords);
router.post('/sensitive-words', adminController.addSensitiveWord);
router.post('/sensitive-words/batch', adminController.batchImportWords);
router.put('/sensitive-words/:wordId', adminController.updateSensitiveWord);
router.delete('/sensitive-words/:wordId', adminController.deleteSensitiveWord);
router.post('/sensitive-words/test', adminController.testSensitiveWords);

export default router;
