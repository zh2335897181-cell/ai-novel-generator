-- =====================================================
-- 数据库性能优化索引
-- 创建时间: 2026-05-12
-- 目的: 优化高频查询场景，提升响应速度
-- =====================================================

-- -----------------------------------------------------
-- 1. novel 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_novel_user_created ON novel(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_novel_user_status ON novel(user_id, status);
CREATE INDEX IF NOT EXISTS idx_novel_published ON novel(is_published, updated_at DESC);

-- -----------------------------------------------------
-- 2. story_content 表索引（核心高频查询）
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_content_novel_chapter ON story_content(novel_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_content_novel_created ON story_content(novel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_status_chapter ON story_content(status, novel_id, chapter_number);

-- 全文搜索索引（按需启用，会增加存储空间）
-- ALTER TABLE story_content ADD FULLTEXT INDEX idx_content_fulltext (content);

-- -----------------------------------------------------
-- 3. character_state 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_character_novel ON character_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_character_novel_level ON character_state(novel_id, level DESC);
CREATE INDEX IF NOT EXISTS idx_character_novel_importance ON character_state(novel_id, importance DESC);
CREATE INDEX IF NOT EXISTS idx_character_novel_name ON character_state(novel_id, name);

-- -----------------------------------------------------
-- 4. minor_character_state 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_minor_char_novel ON minor_character_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_minor_char_novel_mentioned ON minor_character_state(novel_id, last_mentioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_minor_char_novel_name ON minor_character_state(novel_id, name);

-- -----------------------------------------------------
-- 5. item_state 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_item_novel ON item_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_item_novel_mentioned ON item_state(novel_id, last_mentioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_novel_name ON item_state(novel_id, name);

-- -----------------------------------------------------
-- 6. location_state 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_location_novel ON location_state(novel_id);
CREATE INDEX IF NOT EXISTS idx_location_novel_name ON location_state(novel_id, name);

-- -----------------------------------------------------
-- 7. timeline_events 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_timeline_novel_date ON timeline_events(novel_id, event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_created ON timeline_events(novel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_chapter ON timeline_events(novel_id, related_chapter);
CREATE INDEX IF NOT EXISTS idx_timeline_novel_importance ON timeline_events(novel_id, importance DESC, event_date);

-- -----------------------------------------------------
-- 8. story_summary 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_summary_novel ON story_summary(novel_id);

-- -----------------------------------------------------
-- 9. rag_chunk 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_rag_novel ON rag_chunk(novel_id);
CREATE INDEX IF NOT EXISTS idx_rag_novel_source ON rag_chunk(novel_id, source_type, source_id);

-- -----------------------------------------------------
-- 10. world_state 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_world_novel ON world_state(novel_id);

-- -----------------------------------------------------
-- 11. user 表索引
-- -----------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON user(username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_role_status ON user(role, status);
CREATE INDEX IF NOT EXISTS idx_user_created ON user(created_at DESC);

-- -----------------------------------------------------
-- 12. chapter_outline 表索引
-- -----------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_chapter_outline_novel ON chapter_outline(novel_id, chapter_number);

-- -----------------------------------------------------
-- 13. 管理员表索引
-- -----------------------------------------------------

-- content_review 审核表
CREATE INDEX IF NOT EXISTS idx_review_status_type ON content_review(status, content_type);
CREATE INDEX IF NOT EXISTS idx_review_novel_status ON content_review(novel_id, status);

-- report 举报表
CREATE INDEX IF NOT EXISTS idx_report_status_type ON report(status, type);
CREATE INDEX IF NOT EXISTS idx_report_handler_status ON report(handler_id, status);

-- admin_log 操作日志表
CREATE INDEX IF NOT EXISTS idx_adminlog_created ON admin_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adminlog_admin_action ON admin_log(admin_id, action);
CREATE INDEX IF NOT EXISTS idx_adminlog_target ON admin_log(target_type, target_id);

-- -----------------------------------------------------
-- 索引优化说明
-- -----------------------------------------------------

-- 查询性能验证:
-- EXPLAIN SELECT * FROM story_content WHERE novel_id = 1 AND chapter_number = 1;
-- EXPLAIN SELECT * FROM character_state WHERE novel_id = 1 ORDER BY level DESC;
-- EXPLAIN SELECT * FROM timeline_events WHERE novel_id = 1 ORDER BY event_date;

-- 索引使用监控 (MySQL 8.0):
-- SELECT * FROM performance_schema.table_io_waits_summary_by_index_usage
-- WHERE INDEX_NAME IS NOT NULL ORDER BY SUM_TIMER_WAIT DESC;

-- 查看表索引:
-- SHOW INDEX FROM story_content;
-- SHOW INDEX FROM character_state;
