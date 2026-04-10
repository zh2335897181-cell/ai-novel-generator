-- =====================================================
-- 数据库性能优化索引
-- 创建时间: 2024-04-10
-- 目的: 优化高频查询场景，提升响应速度
-- =====================================================

-- -----------------------------------------------------
-- 1. 小说相关表索引
-- -----------------------------------------------------

-- novels 表索引
CREATE INDEX IF NOT EXISTS idx_novels_user_created ON novels(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_user_status ON novels(user_id, status);

-- -----------------------------------------------------
-- 2. 故事内容表索引
-- -----------------------------------------------------

-- story_content 表索引（核心高频查询）
CREATE INDEX IF NOT EXISTS idx_content_novel_chapter ON story_content(novel_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_content_novel_created ON story_content(novel_id, created_at DESC);

-- 全文搜索索引（MySQL 5.7+ / 8.0 支持）
-- 注意: 仅当需要全文搜索时启用，会增加存储空间
-- ALTER TABLE story_content ADD FULLTEXT INDEX idx_content_fulltext (content);

-- -----------------------------------------------------
-- 3. 角色状态表索引
-- -----------------------------------------------------

-- character_state 表索引
CREATE INDEX IF NOT EXISTS idx_character_novel ON character_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_character_novel_level ON character_state(novel_id, level DESC);
CREATE INDEX IF NOT EXISTS idx_character_novel_importance ON character_state(novel_id, importance DESC);

-- minor_character_state 表索引
CREATE INDEX IF NOT EXISTS idx_minor_char_novel ON minor_character_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_minor_char_novel_mentioned ON minor_character_state(novel_id, last_mentioned_at DESC);

-- -----------------------------------------------------
-- 4. 物品与地点表索引
-- -----------------------------------------------------

-- item_state 表索引
CREATE INDEX IF NOT EXISTS idx_item_novel ON item_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_item_novel_mentioned ON item_state(novel_id, last_mentioned_at DESC);

-- location_state 表索引
CREATE INDEX IF NOT EXISTS idx_location_novel ON location_state(novel_id);

-- -----------------------------------------------------
-- 5. 时间线事件表索引
-- -----------------------------------------------------

-- timeline_events 表索引
CREATE INDEX IF NOT EXISTS idx_timeline_novel_date ON timeline_events(novel_id, event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_created ON timeline_events(novel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_chapter ON timeline_events(novel_id, related_chapter);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_importance ON timeline_events(novel_id, importance DESC, event_date);

-- -----------------------------------------------------
-- 6. 故事摘要表索引
-- -----------------------------------------------------

-- story_summary 表索引
CREATE INDEX IF NOT EXISTS idx_summary_novel ON story_summary(novel_id);

-- story_summary_chunks 表索引（RAG检索优化）
CREATE INDEX IF NOT EXISTS idx_summary_chunks_novel ON story_summary_chunks(novel_id);
CREATE INDEX IF NOT EXISTS idx_summary_chunks_archived ON story_summary_chunks(novel_id, is_archived);

-- -----------------------------------------------------
-- 7. 世界状态表索引
-- -----------------------------------------------------

-- world_state 表索引
CREATE INDEX IF NOT EXISTS idx_world_novel ON world_state(novel_id);

-- -----------------------------------------------------
-- 8. 用户相关表索引
-- -----------------------------------------------------

-- users 表索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ai_config 表索引
CREATE INDEX IF NOT EXISTS idx_aiconfig_user ON ai_config(user_id);

-- user_generated_content 表索引（内容审核用）
CREATE INDEX IF NOT EXISTS idx_content_user_created ON user_generated_content(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_status ON user_generated_content(content_status);
CREATE INDEX IF NOT EXISTS idx_content_review ON user_generated_content(content_status, review_status);

-- -----------------------------------------------------
-- 9. 对话历史表索引（如存在）
-- -----------------------------------------------------

-- chat_history 表索引
-- CREATE INDEX IF NOT EXISTS idx_chat_novel ON chat_history(novel_id);
-- CREATE INDEX IF NOT EXISTS idx_chat_novel_session ON chat_history(novel_id, session_id);

-- -----------------------------------------------------
-- 索引优化说明
-- -----------------------------------------------------

-- 查询性能验证:
-- EXPLAIN SELECT * FROM story_content WHERE novel_id = 1 AND chapter_number = 1;
-- EXPLAIN SELECT * FROM character_state WHERE novel_id = 1 ORDER BY level DESC;
-- EXPLAIN SELECT * FROM timeline_events WHERE novel_id = 1 ORDER BY event_date;

-- 索引使用监控（MySQL 8.0）:
-- SELECT * FROM performance_schema.table_io_waits_summary_by_index_usage 
-- WHERE INDEX_NAME IS NOT NULL ORDER BY SUM_TIMER_WAIT DESC;

-- 查看表索引:
-- SHOW INDEX FROM story_content;
-- SHOW INDEX FROM character_state;
