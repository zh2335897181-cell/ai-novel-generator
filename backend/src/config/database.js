import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 添加连接超时
  connectTimeout: 10000, // 10秒连接超时
  acquireTimeout: 60000, // 60秒获取连接超时
  timeout: 60000, // 60秒查询超时
  // 启用连接测试
  testOnBorrow: true,
  // 不自动解析JSON字段，保持为字符串
  jsonStrings: true,
  // 空闲连接超时
  idleTimeout: 300000 // 5分钟
});

export default pool;
