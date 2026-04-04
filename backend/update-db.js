import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function updateDatabase() {
  console.log('开始更新数据库...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ 数据库连接成功！');
    
    // 读取SQL文件
    const sql = fs.readFileSync('../database/add_features.sql', 'utf8');
    
    // 执行SQL
    await connection.query(sql);
    
    console.log('✅ 数据库更新成功！');
    
    // 查看所有表
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n当前数据库表:');
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ 数据库更新失败:', error.message);
    process.exit(1);
  }
}

updateDatabase();
