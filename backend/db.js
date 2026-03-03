const mysql = require('mysql2/promise');
require('dotenv').config();

// We'll use a pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = {
  execute: async (sql, params) => {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL Error:', err.message);
      throw err;
    }
  },
  pool
};
