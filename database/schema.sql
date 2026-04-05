-- ========================
-- AI小说生成系统 - MySQL数据库设计
-- ========================

CREATE DATABASE IF NOT EXISTS ai_novel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_novel_db;

-- 1️⃣ 用户表
CREATE TABLE `user` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2️⃣ 小说表
CREATE TABLE `novel` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `title` VARCHAR(200) NOT NULL COMMENT '小说标题',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    INDEX idx_user_id (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='小说表';

-- 3️⃣ 世界设定表
CREATE TABLE `world_state` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL UNIQUE COMMENT '小说ID',
    `rules` TEXT COMMENT '世界规则',
    `background` TEXT COMMENT '世界背景',
    `extra` JSON COMMENT '扩展属性（魔法体系、科技等级等）',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='世界设定表';

-- 4️⃣ 角色状态表（核心：结构化存储）
CREATE TABLE `character_state` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `name` VARCHAR(100) NOT NULL COMMENT '角色名',
    `level` INT DEFAULT 1 COMMENT '等级',
    `status` VARCHAR(20) DEFAULT '正常' COMMENT '状态：正常/受伤/死亡',
    `attributes` JSON COMMENT '扩展属性（力量、智力、装备等）',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_id (`novel_id`),
    INDEX idx_status (`status`),
    UNIQUE KEY uk_novel_name (`novel_id`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色状态表';

-- 5️⃣ 故事摘要表
CREATE TABLE `story_summary` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL UNIQUE COMMENT '小说ID',
    `summary` TEXT COMMENT '当前剧情摘要',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故事摘要表';

-- 6️⃣ 故事内容表
CREATE TABLE `story_content` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `content` TEXT NOT NULL COMMENT '生成的内容',
    `word_count` INT DEFAULT 0 COMMENT '字数',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_created (`novel_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='故事内容表';

-- 7️⃣ 物品状态表（新增）
CREATE TABLE `item_state` (
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

-- 8️⃣ 地点状态表（新增）
CREATE TABLE `location_state` (
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

-- 9️⃣ 时间线事件表（新增）
CREATE TABLE `timeline_events` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `novel_id` BIGINT NOT NULL COMMENT '小说ID',
    `title` VARCHAR(255) NOT NULL COMMENT '事件标题',
    `event_date` DATETIME COMMENT '事件发生的日期时间',
    `type` VARCHAR(50) DEFAULT 'event' COMMENT '事件类型：chapter/character/event/battle/turning/daily',
    `description` TEXT COMMENT '事件描述',
    `importance` INT DEFAULT 3 COMMENT '重要性：1-5',
    `related_characters` JSON COMMENT '关联角色ID列表',
    `related_chapter` INT COMMENT '关联章节编号',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
    INDEX idx_novel_id (`novel_id`),
    INDEX idx_event_date (`event_date`),
    INDEX idx_type (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='时间线事件表';

-- 插入测试数据
INSERT INTO `user` (`username`, `password`) VALUES ('test', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH');
