-- 添加小说风格、章节大纲、境界系统
USE ai_novel_db;

-- 修改world_state表，添加风格和境界系统（检查是否存在）
SET @dbname = 'ai_novel_db';
SET @tablename = 'world_state';

-- 添加genre字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'genre');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `world_state` ADD COLUMN `genre` VARCHAR(50) COMMENT ''小说类型'' AFTER `novel_id`',
    'SELECT ''genre already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加style字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'style');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `world_state` ADD COLUMN `style` VARCHAR(100) COMMENT ''写作风格'' AFTER `genre`',
    'SELECT ''style already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 添加realm_system字段
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'realm_system');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `world_state` ADD COLUMN `realm_system` JSON COMMENT ''境界体系'' AFTER `extra`',
    'SELECT ''realm_system already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 9️⃣ 章节大纲表（新增）
CREATE TABLE IF NOT EXISTS `chapter_outline` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `chapter_number` INT NOT NULL COMMENT '章节序号',
    `title` VARCHAR(200) COMMENT '章节标题',
    `outline` TEXT COMMENT '章节大纲',
    `status` VARCHAR(20) DEFAULT '未开始' COMMENT '状态：未开始/进行中/已完成',
    `word_count` INT DEFAULT 0 COMMENT '已写字数',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_chapter (`novel_id`, `chapter_number`),
    UNIQUE KEY uk_novel_chapter (`novel_id`, `chapter_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='章节大纲表';

-- 修改character_state表，添加境界字段
SET @tablename = 'character_state';
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = 'realm');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `character_state` ADD COLUMN `realm` VARCHAR(50) COMMENT ''境界'' AFTER `level`',
    'SELECT ''realm already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Features added successfully!' as status;
