-- 添加配角表和章节元数据
USE ai_novel_db;

-- 9️⃣ 配角状态表（用于存储炮灰、路人等次要角色）
CREATE TABLE IF NOT EXISTS `minor_character_state` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `name` VARCHAR(100) NOT NULL COMMENT '配角名称',
    `role` VARCHAR(50) DEFAULT '路人' COMMENT '角色类型：路人/炮灰/店主/守卫等',
    `status` VARCHAR(20) DEFAULT '正常' COMMENT '状态：正常/受伤/死亡',
    `description` TEXT COMMENT '简短描述',
    `items` JSON COMMENT '持有的物品列表',
    `attributes` JSON COMMENT '扩展属性',
    `first_appearance` INT COMMENT '首次出现的章节号',
    `last_appearance` INT COMMENT '最后出现的章节号',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_id (`novel_id`),
    INDEX idx_status (`status`),
    UNIQUE KEY uk_novel_name (`novel_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配角状态表';

-- 修改story_content表，添加章节元数据字段
SET @exist_title := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'ai_novel_db' 
                     AND TABLE_NAME = 'story_content' 
                     AND COLUMN_NAME = 'chapter_title');

SET @sqlstmt_title := IF(@exist_title = 0, 
                         'ALTER TABLE `story_content` ADD COLUMN `chapter_title` VARCHAR(200) COMMENT ''章节标题'' AFTER `novel_id`',
                         'SELECT ''Column chapter_title already exists'' as status');

PREPARE stmt FROM @sqlstmt_title;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_outline := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                       WHERE TABLE_SCHEMA = 'ai_novel_db' 
                       AND TABLE_NAME = 'story_content' 
                       AND COLUMN_NAME = 'chapter_outline');

SET @sqlstmt_outline := IF(@exist_outline = 0, 
                           'ALTER TABLE `story_content` ADD COLUMN `chapter_outline` TEXT COMMENT ''章节大纲'' AFTER `chapter_title`',
                           'SELECT ''Column chapter_outline already exists'' as status');

PREPARE stmt FROM @sqlstmt_outline;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_chapter_num := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                           WHERE TABLE_SCHEMA = 'ai_novel_db' 
                           AND TABLE_NAME = 'story_content' 
                           AND COLUMN_NAME = 'chapter_number');

SET @sqlstmt_chapter_num := IF(@exist_chapter_num = 0, 
                               'ALTER TABLE `story_content` ADD COLUMN `chapter_number` INT COMMENT ''章节号'' AFTER `novel_id`',
                               'SELECT ''Column chapter_number already exists'' as status');

PREPARE stmt FROM @sqlstmt_chapter_num;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Minor character table and chapter metadata created successfully!' as status;
