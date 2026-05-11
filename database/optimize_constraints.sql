-- =====================================================
-- 数据库约束全面优化
-- 创建时间: 2026-05-12
-- 说明: 补全外键、统一类型、补齐缺失字段
-- 执行: mysql -u root -p ai_novel_db < optimize_constraints.sql
-- =====================================================

USE ai_novel_db;

-- =====================================================
-- PART 1: 补齐核心表缺失字段
-- =====================================================

-- 1.1 user 表添加 email 字段（add_indexes.sql 引用了此索引）
ALTER TABLE `user`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(100) NULL COMMENT '邮箱' AFTER `username`,
  ADD UNIQUE INDEX IF NOT EXISTS `idx_users_email` (`email`);

-- 1.2 character_state 表添加 importance 字段（add_indexes.sql 引用了此索引）
ALTER TABLE `character_state`
  ADD COLUMN IF NOT EXISTS `importance` INT DEFAULT 3 COMMENT '重要性 1-5' AFTER `attributes`;

-- 1.3 item_state 表添加 last_mentioned_at 字段（add_indexes.sql 引用了此索引）
ALTER TABLE `item_state`
  ADD COLUMN IF NOT EXISTS `last_mentioned_at` INT NULL COMMENT '最后提及章节号' AFTER `attributes`;

-- 1.4 minor_character_state 表添加 last_mentioned_at 字段（add_indexes.sql 引用了此索引）
ALTER TABLE `minor_character_state`
  ADD COLUMN IF NOT EXISTS `last_mentioned_at` INT NULL COMMENT '最后提及章节号' AFTER `last_appearance`;


-- =====================================================
-- PART 2: 统一主键类型 INT → BIGINT
-- =====================================================

-- 2.1 content_review 表主键及外键列类型
ALTER TABLE `content_review`
  MODIFY COLUMN `id` BIGINT AUTO_INCREMENT,
  MODIFY COLUMN `content_id` BIGINT NULL COMMENT '内容ID',
  MODIFY COLUMN `novel_id` BIGINT NULL COMMENT '小说ID',
  MODIFY COLUMN `user_id` BIGINT NULL COMMENT '提交用户ID',
  MODIFY COLUMN `reviewer_id` BIGINT NULL COMMENT '审核人ID';

-- 2.2 report 表主键及外键列类型
ALTER TABLE `report`
  MODIFY COLUMN `id` BIGINT AUTO_INCREMENT,
  MODIFY COLUMN `reporter_id` BIGINT NULL COMMENT '举报人ID',
  MODIFY COLUMN `target_user_id` BIGINT NULL COMMENT '被举报用户ID',
  MODIFY COLUMN `novel_id` BIGINT NULL COMMENT '相关小说ID',
  MODIFY COLUMN `content_id` BIGINT NULL COMMENT '相关内容ID',
  MODIFY COLUMN `handler_id` BIGINT NULL COMMENT '处理人ID';

-- 2.3 admin_log 表主键及外键列类型
ALTER TABLE `admin_log`
  MODIFY COLUMN `id` BIGINT AUTO_INCREMENT,
  MODIFY COLUMN `admin_id` BIGINT NULL COMMENT '管理员ID',
  MODIFY COLUMN `target_id` BIGINT NULL COMMENT '目标ID';

-- 2.4 system_settings 表主键类型
ALTER TABLE `system_settings`
  MODIFY COLUMN `id` BIGINT AUTO_INCREMENT;


-- =====================================================
-- PART 3: 补全外键约束
-- =====================================================

-- 3.1 content_review 表外键
ALTER TABLE `content_review`
  ADD CONSTRAINT IF NOT EXISTS `fk_review_user`
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS `fk_review_reviewer`
    FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS `fk_review_novel`
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE;

-- 3.2 report 表外键
ALTER TABLE `report`
  ADD CONSTRAINT IF NOT EXISTS `fk_report_reporter`
    FOREIGN KEY (`reporter_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS `fk_report_target`
    FOREIGN KEY (`target_user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS `fk_report_handler`
    FOREIGN KEY (`handler_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS `fk_report_novel`
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE SET NULL;

-- 3.3 admin_log 表外键
ALTER TABLE `admin_log`
  ADD CONSTRAINT IF NOT EXISTS `fk_adminlog_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `user`(`id`) ON DELETE SET NULL;

-- 3.4 user 表 parent_admin_id 外键
ALTER TABLE `user`
  ADD CONSTRAINT IF NOT EXISTS `fk_user_parent_admin`
    FOREIGN KEY (`parent_admin_id`) REFERENCES `user`(`id`) ON DELETE SET NULL;


-- =====================================================
-- PART 4: 补充业务约束索引
-- =====================================================

-- 4.1 content_review 复合查询索引
ALTER TABLE `content_review`
  ADD INDEX IF NOT EXISTS `idx_review_status_type` (`status`, `content_type`),
  ADD INDEX IF NOT EXISTS `idx_review_novel_status` (`novel_id`, `status`);

-- 4.2 report 复合查询索引
ALTER TABLE `report`
  ADD INDEX IF NOT EXISTS `idx_report_status_type` (`status`, `type`),
  ADD INDEX IF NOT EXISTS `idx_report_handler_status` (`handler_id`, `status`);

-- 4.3 admin_log 时间范围索引
ALTER TABLE `admin_log`
  ADD INDEX IF NOT EXISTS `idx_adminlog_created` (`created_at` DESC),
  ADD INDEX IF NOT EXISTS `idx_adminlog_admin_action` (`admin_id`, `action`);

-- 4.4 user 表角色状态复合索引
ALTER TABLE `user`
  ADD INDEX IF NOT EXISTS `idx_user_role_status` (`role`, `status`),
  ADD INDEX IF NOT EXISTS `idx_user_created` (`created_at` DESC);

-- 4.5 novel 表补充发布状态索引
ALTER TABLE `novel`
  ADD INDEX IF NOT EXISTS `idx_novel_published` (`is_published`, `updated_at` DESC);

-- 4.6 story_content 表补充章节号精确查询索引
ALTER TABLE `story_content`
  ADD INDEX IF NOT EXISTS `idx_content_status_chapter` (`status`, `novel_id`, `chapter_number`);


-- =====================================================
-- PART 5: 修正 novel 表缺失字段
-- =====================================================

-- 5.1 确认 novel 表包含发布状态字段
ALTER TABLE `novel`
  ADD COLUMN IF NOT EXISTS `is_published` TINYINT(1) DEFAULT 0 COMMENT '是否发布' AFTER `title`,
  ADD COLUMN IF NOT EXISTS `description` TEXT NULL COMMENT '小说简介' AFTER `title`;


-- =====================================================
-- 验证执行结果
-- =====================================================
SELECT '优化迁移完成' AS status;

-- 查看所有外键约束
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ai_novel_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
