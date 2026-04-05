import pool from '../config/database.js';

/**
 * 基础Repository类
 * 提供通用的数据库操作方法
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * 查询单条记录
   */
  async findOne(conditions = {}, fields = '*') {
    const conn = await pool.getConnection();
    try {
      const { whereClause, values } = this.buildWhereClause(conditions);
      const sql = `SELECT ${fields} FROM ${this.tableName} ${whereClause} LIMIT 1`;
      const [rows] = await conn.query(sql, values);
      return rows[0] || null;
    } finally {
      conn.release();
    }
  }

  /**
   * 查询多条记录
   */
  async findMany(conditions = {}, fields = '*', orderBy = '', limit = null) {
    const conn = await pool.getConnection();
    try {
      const { whereClause, values } = this.buildWhereClause(conditions);
      let sql = `SELECT ${fields} FROM ${this.tableName} ${whereClause}`;
      
      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }
      
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const [rows] = await conn.query(sql, values);
      return rows;
    } finally {
      conn.release();
    }
  }

  /**
   * 查询所有记录
   */
  async findAll(fields = '*', orderBy = '') {
    return this.findMany({}, fields, orderBy);
  }

  /**
   * 根据ID查询
   */
  async findById(id, fields = '*') {
    return this.findOne({ id }, fields);
  }

  /**
   * 插入记录
   */
  async insert(data) {
    const conn = await pool.getConnection();
    try {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(data);

      const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      const [result] = await conn.query(sql, values);
      return result.insertId;
    } finally {
      conn.release();
    }
  }

  /**
   * 更新记录
   */
  async update(conditions, data) {
    const conn = await pool.getConnection();
    try {
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const { whereClause, values: whereValues } = this.buildWhereClause(conditions);
      
      const sql = `UPDATE ${this.tableName} SET ${setClause} ${whereClause}`;
      const values = [...Object.values(data), ...whereValues];
      
      const [result] = await conn.query(sql, values);
      return result.affectedRows;
    } finally {
      conn.release();
    }
  }

  /**
   * 删除记录
   */
  async delete(conditions) {
    const conn = await pool.getConnection();
    try {
      const { whereClause, values } = this.buildWhereClause(conditions);
      const sql = `DELETE FROM ${this.tableName} ${whereClause}`;
      const [result] = await conn.query(sql, values);
      return result.affectedRows;
    } finally {
      conn.release();
    }
  }

  /**
   * 统计记录数
   */
  async count(conditions = {}) {
    const conn = await pool.getConnection();
    try {
      const { whereClause, values } = this.buildWhereClause(conditions);
      const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
      const [rows] = await conn.query(sql, values);
      return rows[0].count;
    } finally {
      conn.release();
    }
  }

  /**
   * 检查记录是否存在
   */
  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * 构建WHERE子句
   */
  buildWhereClause(conditions) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) {
      return { whereClause: '', values: [] };
    }

    const whereParts = keys.map(key => `${key} = ?`);
    const whereClause = `WHERE ${whereParts.join(' AND ')}`;
    const values = Object.values(conditions);

    return { whereClause, values };
  }

  /**
   * 执行原始SQL
   */
  async query(sql, values = []) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(sql, values);
      return rows;
    } finally {
      conn.release();
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction() {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    return conn;
  }

  /**
   * 提交事务
   */
  async commit(conn) {
    await conn.commit();
    conn.release();
  }

  /**
   * 回滚事务
   */
  async rollback(conn) {
    await conn.rollback();
    conn.release();
  }
}

export default BaseRepository;
