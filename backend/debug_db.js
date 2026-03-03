const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
    console.error('Dotenv error:', result.error);
}

async function test() {
    console.log('Testing with vars:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD ? '****' : 'MISSING',
        port: process.env.DB_PORT
    });

    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });
        console.log('Connection successful!');
        await conn.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

test();
