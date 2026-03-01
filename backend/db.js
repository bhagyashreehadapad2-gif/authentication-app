const mysql = require('mysql2/promise');
require('dotenv').config();

// We'll use a pool for MySQL
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL, // Assuming we'll get a mysql:// URI
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
