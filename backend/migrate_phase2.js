import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_novel_db'
});

// Create invite_codes table
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(32) NOT NULL UNIQUE,
      created_by INT NOT NULL,
      max_uses INT DEFAULT 1,
      current_uses INT DEFAULT 0,
      expires_at DATETIME DEFAULT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_created_by (created_by),
      INDEX idx_is_active (is_active),
      FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('invite_codes table created');
} catch (e) {
  console.log('Table error:', e.message);
}

// Add invite_only setting
try {
  await pool.query(
    "INSERT IGNORE INTO system_settings (`key`, `value`, description) VALUES ('invite_only', 'false', '邀请码注册模式开关')"
  );
  console.log('invite_only setting added');
} catch (e) {
  console.log('Setting error:', e.message);
}

console.log('Phase 2 migration done');
await pool.end();
