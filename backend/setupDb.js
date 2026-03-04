const { execute } = require('./db');

const setup = async () => {
  try {
    // MySQL Users table
    await execute(`
      CREATE TABLE IF NOT EXISTS bank_users (
        uid INT AUTO_INCREMENT PRIMARY KEY,
        uname VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role ENUM('USER', 'ADMIN') DEFAULT 'USER',
        balance DECIMAL(15, 2) DEFAULT 10000.00,
        accountNumber VARCHAR(20)
      );
    `);
    console.log('MySQL Users table ensured');

    // MySQL Transactions table
    await execute(`
      CREATE TABLE IF NOT EXISTS bank_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user VARCHAR(255) NOT NULL,
        other_user VARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type ENUM('CREDIT', 'DEBIT') NOT NULL,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('MySQL Transactions table ensured');

    // Seed demo bank_users if empty
    const bank_users = await execute('SELECT * FROM bank_users LIMIT 1');
    if (bank_users.length === 0) {
      const bcrypt = require('bcrypt');
      const pass = await bcrypt.hash('demo123', 10);
      await execute('INSERT INTO bank_users (uname, email, phone, password, balance, accountNumber) VALUES (?, ?, ?, ?, ?, ?)',
        ['demo1', 'demo1@bank.com', '9876543210', pass, 25000.00, '400000000001']);
      await execute('INSERT INTO bank_users (uname, email, phone, password, balance, accountNumber) VALUES (?, ?, ?, ?, ?, ?)',
        ['demo2', 'demo2@bank.com', '9876543211', pass, 15000.00, '400000000002']);
      console.log('Demo bank_users seeded');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error setting up MySQL database:', err.message);
    process.exit(1);
  }
};

setup();
