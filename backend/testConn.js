const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConn() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT),
            ssl: { rejectUnauthorized: false }
        });
        console.log('Successfully connected to MySQL!');
        const [rows] = await connection.execute('SELECT NOW() as currentTime');
        console.log('Current time from DB:', rows[0].currentTime);
        await connection.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

testConn();
