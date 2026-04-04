-- 添加物品和地点表
USE ai_novel_db;

-- 7️⃣ 物品状态表
CREATE TABLE IF NOT EXISTS `item_state` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `name` VARCHAR(100) NOT NULL COMMENT '物品名称',
    `type` VARCHAR(50) COMMENT '物品类型（武器/道具/宝物等）',
    `owner` VARCHAR(100) COMMENT '持有者',
    `status` VARCHAR(20) DEFAULT '存在' COMMENT '状态：存在/损毁/丢失',
    `attributes` JSON COMMENT '扩展属性',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_id (`novel_id`),
    UNIQUE KEY uk_novel_name (`novel_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物品状态表';

-- 8️⃣ 地点状态表
CREATE TABLE IF NOT EXISTS `location_state` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `name` VARCHAR(100) NOT NULL COMMENT '地点名称',
    `type` VARCHAR(50) COMMENT '地点类型（城市/山脉/秘境等）',
    `status` VARCHAR(20) DEFAULT '正常' COMMENT '状态：正常/封闭/毁灭',
    `description` TEXT COMMENT '描述',
    `attributes` JSON COMMENT '扩展属性',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_id (`novel_id`),
    UNIQUE KEY uk_novel_name (`novel_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='地点状态表';

-- 修改story_content表，添加字数字段（如果不存在）
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'ai_novel_db' 
               AND TABLE_NAME = 'story_content' 
               AND COLUMN_NAME = 'word_count');

SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE `story_content` ADD COLUMN `word_count` INT DEFAULT 0 COMMENT ''字数'' AFTER `content`',
                   'SELECT ''Column word_count already exists'' as status');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Tables created successfully!' as status;
