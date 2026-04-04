-- 增强写作风格系统
USE ai_novel_db;

-- 扩展 world_state 表的 style 字段长度，支持更详细的风格描述
SET @exist_style := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                     WHERE TABLE_SCHEMA = 'ai_novel_db' 
                     AND TABLE_NAME = 'world_state' 
                     AND COLUMN_NAME = 'style');

SET @sqlstmt_style := IF(@exist_style = 1, 
                         'ALTER TABLE `world_state` MODIFY COLUMN `style` TEXT COMMENT ''写作风格（详细描述）''',
                         'ALTER TABLE `world_state` ADD COLUMN `style` TEXT COMMENT ''写作风格（详细描述）'' AFTER `genre`');

PREPARE stmt FROM @sqlstmt_style;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加风格示例字段（可选，用于存储风格参考示例）
SET @exist_style_example := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                              WHERE TABLE_SCHEMA = 'ai_novel_db' 
                              AND TABLE_NAME = 'world_state' 
                              AND COLUMN_NAME = 'style_example');

SET @sqlstmt_example := IF(@exist_style_example = 0, 
                           'ALTER TABLE `world_state` ADD COLUMN `style_example` TEXT COMMENT ''风格示例文本'' AFTER `style`',
                           'SELECT ''style_example already exists'' as status');

PREPARE stmt FROM @sqlstmt_example;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Writing style system enhanced successfully!' as status;
