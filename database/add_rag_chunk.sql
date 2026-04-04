-- RAG：按小说存储正文片段与可选向量，用于检索增强生成
USE ai_novel_db;

CREATE TABLE IF NOT EXISTS `rag_chunk` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `novel_id` BIGINT NOT NULL COMMENT '小说ID',
  `source_type` VARCHAR(32) NOT NULL COMMENT 'story | summary | world',
  `source_id` BIGINT NULL COMMENT '关联 story_content.id 等',
  `chapter_number` INT NULL,
  `chunk_index` INT NOT NULL DEFAULT 0,
  `text_content` TEXT NOT NULL COMMENT '片段文本',
  `embedding` JSON NULL COMMENT '可选：向量，与检索模型一致',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`novel_id`) REFERENCES `novel`(`id`) ON DELETE CASCADE,
  INDEX `idx_rag_novel` (`novel_id`),
  INDEX `idx_rag_novel_source` (`novel_id`, `source_type`, `source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RAG 文本片段';
