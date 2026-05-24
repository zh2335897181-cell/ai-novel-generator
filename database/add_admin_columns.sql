-- ========================
-- 管理员系统 - 数据库迁移
-- ========================

USE ai_novel_db;

-- 1️⃣ 为 user 表添加管理员相关字段
ALTER TABLE `user` 
ADD COLUMN IF NOT EXISTS `role` ENUM('user', 'admin', 'super_admin') DEFAULT 'user' COMMENT '用户角色',
ADD COLUMN IF NOT EXISTS `status` ENUM('active', 'banned', 'muted') DEFAULT 'active' COMMENT '用户状态',
ADD COLUMN IF NOT EXISTS `ban_reason` TEXT COMMENT '封禁原因',
ADD COLUMN IF NOT EXISTS `last_login` DATETIME COMMENT '最后登录时间',
ADD COLUMN IF NOT EXISTS `parent_admin_id` BIGINT COMMENT '上级管理员ID（仅次管理员有）',
ADD COLUMN IF NOT EXISTS `permissions` TEXT DEFAULT NULL COMMENT '子管理员权限JSON数组';

-- 2️⃣ 为 novel 表添加状态字段
ALTER TABLE `novel` 
ADD COLUMN IF NOT EXISTS `status` ENUM('active', 'blocked', 'reviewing') DEFAULT 'active' COMMENT '小说状态';

-- 3️⃣ 为 story_content 表添加状态字段（用于章节审核）
ALTER TABLE `story_content` 
ADD COLUMN IF NOT EXISTS `status` ENUM('active', 'blocked', 'reviewing') DEFAULT 'active' COMMENT '内容状态',
ADD COLUMN IF NOT EXISTS `chapter_number` INT COMMENT '章节编号';

-- 4️⃣ 创建内容审核表
CREATE TABLE IF NOT EXISTS `content_review` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `content_type` ENUM('novel', 'chapter', 'character', 'world') NOT NULL COMMENT '内容类型',
  `content_id` INT COMMENT '内容ID',
  `novel_id` BIGINT COMMENT '小说ID',
  `content` LONGTEXT COMMENT '待审核内容',
  `user_id` BIGINT COMMENT '提交用户ID',
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT '审核状态',
  `reason` TEXT COMMENT '审核原因',
  `reviewer_id` BIGINT COMMENT '审核人ID',
  `reviewed_at` DATETIME COMMENT '审核时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_content_type` (`content_type`),
  INDEX `idx_novel_id` (`novel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='内容审核表';

-- 5️⃣ 创建举报表
CREATE TABLE IF NOT EXISTS `report` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('novel', 'chapter', 'user', 'other') NOT NULL COMMENT '举报类型',
  `reporter_id` BIGINT COMMENT '举报人ID',
  `target_user_id` BIGINT COMMENT '被举报用户ID',
  `novel_id` BIGINT COMMENT '相关小说ID',
  `content_id` BIGINT COMMENT '相关内容ID',
  `reason` TEXT NOT NULL COMMENT '举报原因',
  `status` ENUM('pending', 'resolved', 'dismissed') DEFAULT 'pending' COMMENT '处理状态',
  `handler_id` BIGINT COMMENT '处理人ID',
  `handle_result` TEXT COMMENT '处理结果',
  `handled_at` DATETIME COMMENT '处理时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='举报表';

-- 6️⃣ 创建管理员操作日志表
CREATE TABLE IF NOT EXISTS `admin_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` BIGINT COMMENT '管理员ID',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) COMMENT '目标类型',
  `target_id` INT COMMENT '目标ID',
  `detail` JSON COMMENT '操作详情',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_action` (`action`),
  INDEX `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员操作日志表';

-- 7️⃣ 创建系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(100) UNIQUE NOT NULL COMMENT '设置键',
  `value` TEXT COMMENT '设置值',
  `description` VARCHAR(255) COMMENT '描述',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 8️⃣ 插入默认系统设置
INSERT IGNORE INTO `system_settings` (`key`, `value`, `description`) VALUES
('auto_review', 'false', '自动审核开关'),
('sensitive_words', '', '敏感词列表，逗号分隔'),
('max_novels_per_user', '50', '每用户最大小说数'),
('max_chapters_per_novel', '500', '每小说最大章节数'),
('guest_time_limit', '10', '游客使用时间限制(分钟)'),
('maintenance_mode', 'false', '维护模式开关'),
('maintenance_estimated_end', '', '维护预计完成时间'),
('maintenance_scheduled_enabled', 'false', '定时维护开关'),
('maintenance_scheduled_time', '', '定时维护开始时间'),
('maintenance_scheduled_end', '', '定时维护结束时间'),
('site_notice', '', '站点公告'),
('site_notice_enabled', 'false', '站点公告开关'),
('site_notice_type', 'info', '站点公告类型(info/warning/danger)');

-- 9️⃣ 创建 character 表（如果不存在，用于角色管理）
CREATE TABLE IF NOT EXISTS `character` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` BIGINT NOT NULL COMMENT '小说ID',
  `name` VARCHAR(100) NOT NULL COMMENT '角色名',
  `level` INT DEFAULT 1 COMMENT '等级',
  `attributes` JSON COMMENT '角色属性',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
  INDEX `idx_novel_id` (`novel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 🔟 创建 content 表（如果不存在，用于章节管理）
CREATE TABLE IF NOT EXISTS `content` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` BIGINT NOT NULL COMMENT '小说ID',
  `chapter_number` INT COMMENT '章节编号',
  `chapter_title` VARCHAR(200) COMMENT '章节标题',
  `content` TEXT COMMENT '章节内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
  INDEX `idx_novel_id` (`novel_id`),
  INDEX `idx_chapter` (`novel_id`, `chapter_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='章节内容表';

-- 1️⃣1️⃣ 创建 world_state 表（如果不存在，用于世界观管理）
CREATE TABLE IF NOT EXISTS `world_state` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` BIGINT NOT NULL UNIQUE COMMENT '小说ID',
  `rules` TEXT COMMENT '世界规则',
  `background` TEXT COMMENT '世界背景',
  `extra` JSON COMMENT '扩展属性',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='世界观表';

-- 完成
SELECT '管理员系统数据库迁移完成' AS message;

-- 创建主管理员账号（admin/root）
INSERT INTO `user` (`username`, `password`, `role`, `status`)
VALUES ('admin', '$2a$10$I7T62Fmkdm3XoOd2ySoVvOv3Pdf2smXNR.5I73QXSOTjMilhjnX9S', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE `role` = 'super_admin';

-- 1️⃣4️⃣ 创建更新日志表
CREATE TABLE IF NOT EXISTS `changelog` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(20) NOT NULL,
  `release_date` DATE NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `changes` TEXT NOT NULL,
  `type` ENUM('feature', 'improvement', 'bugfix', 'breaking') DEFAULT 'feature',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统更新日志';
