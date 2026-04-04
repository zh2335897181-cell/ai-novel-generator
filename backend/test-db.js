import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('测试数据库连接...');
  console.log('配置:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ 数据库连接成功！');
    
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log('MySQL版本:', rows[0].version);
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('数据库表:', tables);
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误代码:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n可能的原因：');
      console.log('1. MySQL服务未启动');
      console.log('2. 端口3306被占用或不正确');
      console.log('3. 防火墙阻止连接');
      console.log('\n建议：');
      console.log('- 检查MySQL服务是否在3306端口运行');
      console.log('- 尝试修改.env中的DB_PORT为3307或其他端口');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n用户名或密码错误');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n数据库不存在，请先运行 database/schema.sql 创建数据库');
    }
  }
}

testConnection();
