const { execute } = require('./db');

const setup = async () => {
  try {
    // MySQL syntax for creating users table with specified columns
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        uid INT AUTO_INCREMENT PRIMARY KEY,
        uname VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role ENUM('USER', 'ADMIN') DEFAULT 'USER'
      );
    `);
    console.log('MySQL Users table ensured');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up MySQL database:', err.message);
    process.exit(1);
  }
};

setup();
