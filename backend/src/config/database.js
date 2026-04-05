import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库连接池配置 - 优化版
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // 连接池核心配置
  waitForConnections: true,
  connectionLimit: 20,          // 增加连接数限制
  queueLimit: 100,              // 队列限制
  
  // 连接超时配置
  connectTimeout: 10000,        // 10秒连接超时
  acquireTimeout: 60000,        // 60秒获取连接超时
  timeout: 60000,               // 60秒查询超时
  
  // 连接保活配置
  idleTimeout: 300000,          // 5分钟空闲超时
  enableKeepAlive: true,         // 启用keepalive
  keepAliveInitialDelay: 10000, // 10秒后开始keepalive
  
  // 连接测试配置
  testOnBorrow: true,
  
  // 不自动解析JSON字段
  jsonStrings: true,
  
  // 连接重试配置
  reconnect: true,
  maxReconnects: 3
});

// 连接池健康检查
export const checkPoolHealth = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { healthy: true, connections: pool._connectionQueue?.length || 0 };
  } catch (error) {
    console.error('[DB Pool] 健康检查失败:', error.message);
    return { healthy: false, error: error.message };
  }
};

// 获取连接池状态
export const getPoolStatus = () => {
  return {
    totalConnections: pool._allConnections?.length || 0,
    freeConnections: pool._freeConnections?.length || 0,
    queuedRequests: pool._connectionQueue?.length || 0,
    acquiringConnections: pool._acquiringConnections?.length || 0
  };
};

// 数据库备份函数
export const backupDatabase = async () => {
  const backupDir = path.join(__dirname, '../../backups');
  
  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${process.env.DB_NAME}-${timestamp}.sql`);
  
  try {
    // 获取所有表
    const [tables] = await pool.query('SHOW TABLES');
    const tableNameKey = Object.keys(tables[0])[0];
    
    let backupSQL = `-- 数据库备份\n`;
    backupSQL += `-- 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    backupSQL += `-- 数据库: ${process.env.DB_NAME}\n\n`;
    backupSQL += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    
    for (const table of tables) {
      const tableName = table[tableNameKey];
      
      // 获取表结构
      const [createTable] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      backupSQL += `-- 表结构: ${tableName}\n`;
      backupSQL += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      backupSQL += createTable[0]['Create Table'] + ';\n\n';
      
      // 获取表数据
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        backupSQL += `-- 表数据: ${tableName}\n`;
        for (const row of rows) {
          const columns = Object.keys(row).map(key => `\`${key}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          
          backupSQL += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        backupSQL += '\n';
      }
    }
    
    backupSQL += `SET FOREIGN_KEY_CHECKS=1;\n`;
    
    // 写入文件
    fs.writeFileSync(backupFile, backupSQL, 'utf8');
    
    console.log(`[DB Backup] 备份成功: ${backupFile}`);
    
    // 清理旧备份（保留最近30天）
    await cleanOldBackups(backupDir);
    
    return {
      success: true,
      file: backupFile,
      timestamp: new Date().toISOString(),
      tables: tables.length
    };
  } catch (error) {
    console.error('[DB Backup] 备份失败:', error.message);
    return { success: false, error: error.message };
  }
};

// 清理旧备份
const cleanOldBackups = async (backupDir) => {
  try {
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > thirtyDays) {
        fs.unlinkSync(filePath);
        console.log(`[DB Backup] 删除旧备份: ${file}`);
      }
    }
  } catch (error) {
    console.error('[DB Backup] 清理旧备份失败:', error.message);
  }
};

// 自动备份任务（每天凌晨2点）
export const startAutoBackup = () => {
  const scheduleBackup = () => {
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(2, 0, 0, 0);
    
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }
    
    const delay = nextBackup - now;
    
    setTimeout(async () => {
      console.log('[DB Backup] 执行自动备份...');
      await backupDatabase();
      scheduleBackup(); // 重新调度
    }, delay);
    
    console.log(`[DB Backup] 下次备份时间: ${nextBackup.toLocaleString('zh-CN')}`);
  };
  
  scheduleBackup();
};

// 监听连接池事件
pool.on('acquire', function (connection) {
  console.log('[DB Pool] 获取连接:', connection.threadId);
});

pool.on('enqueue', function () {
  console.log('[DB Pool] 连接请求排队, 等待可用连接...');
});

pool.on('release', function (connection) {
  console.log('[DB Pool] 释放连接:', connection.threadId);
});

export default pool;

