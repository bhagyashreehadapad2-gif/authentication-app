const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const db = require('./db');
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

console.log('--- Server Config ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('---------------------');

// In-Memory Database (REMOVED - Using MySQL)
// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Helper: generate a mock account number
const generateAccountNumber = (uid) => `4000${String(uid).padStart(8, '0')}`;

// ─── Middleware: Auth Guard ────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(`Auth Success: ${decoded.sub}`);
        req.user = decoded;
        next();
    } catch (err) {
        console.warn(`Auth Failed: ${err.message}`);
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// TRANSACTIONS (Moved up for debugging)
app.get('/transactions', requireAuth, async (req, res) => {
    console.log(`Fetching transactions for: ${req.user.sub}`);
    try {
        const userTransactions = await db.execute(
            'SELECT * FROM bank_transactions WHERE user = ? ORDER BY timestamp DESC',
            [req.user.sub]
        );
        console.log(`Found ${userTransactions.length} transactions`);
        res.json({ transactions: userTransactions });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

// REGISTER
app.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Missing required fields' });

        const existingUser = await db.execute('SELECT * FROM bank_users WHERE uname = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            if (existingUser[0].uname === username) return res.status(409).json({ message: 'Username already taken' });
            return res.status(409).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.execute(
            'INSERT INTO bank_users (uname, email, phone, password, balance) VALUES (?, ?, ?, ?, ?)',
            [username, email, phone || '', hashedPassword, 10000.00]
        );
        const uid = result.insertId;
        const accountNumber = generateAccountNumber(uid);
        await db.execute('UPDATE bank_users SET accountNumber = ? WHERE uid = ?', [accountNumber, uid]);

        console.log(`User registered successfully: ${username} (uid: ${uid}). Sending 201 response.`);
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login attempt for: ${username}`);
        const rows = await db.execute('SELECT * FROM bank_users WHERE uname = ?', [username]);
        const user = rows[0];
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { sub: user.uname, role: user.role },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '24h' }
        );

        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        console.log(`Login Success: ${username}. Cookie set.`);
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// LOGOUT
app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

// ME — full user info
app.get('/me', requireAuth, async (req, res) => {
    const rows = await db.execute('SELECT uname, email, phone, role, balance, accountNumber FROM bank_users WHERE uname = ?', [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
        user: {
            username: user.uname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            balance: user.balance,
            accountNumber: user.accountNumber
        }
    });
});

// BALANCE
app.get('/balance', requireAuth, async (req, res) => {
    const rows = await db.execute('SELECT balance, accountNumber FROM bank_users WHERE uname = ?', [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.balance, accountNumber: user.accountNumber });
});

// DEPOSIT
app.post('/deposit', requireAuth, async (req, res) => {
    const { amount, description } = req.body;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0)
        return res.status(400).json({ message: 'Invalid deposit amount' });
    if (depositAmount > 1000000)
        return res.status(400).json({ message: 'Maximum deposit limit is ₹10,00,000' });

    try {
        const rows = await db.execute('SELECT balance FROM bank_users WHERE uname = ?', [req.user.sub]);
        const user = rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newBalance = parseFloat(user.balance) + depositAmount;
        await db.execute('UPDATE bank_users SET balance = ? WHERE uname = ?', [newBalance, req.user.sub]);

        const timestamp = new Date().toISOString();
        await db.execute(
            'INSERT INTO bank_transactions (user, other_user, amount, type, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.sub, 'Self', depositAmount, 'CREDIT', description || 'Deposit', timestamp]
        );

        res.status(200).json({ message: 'Deposit successful', newBalance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during deposit' });
    }
});

// WITHDRAW
app.post('/withdraw', requireAuth, async (req, res) => {
    const { amount, description } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0)
        return res.status(400).json({ message: 'Invalid withdrawal amount' });

    try {
        const rows = await db.execute('SELECT balance FROM bank_users WHERE uname = ?', [req.user.sub]);
        const user = rows[0];
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.balance < withdrawAmount)
            return res.status(400).json({ message: 'Insufficient balance' });

        const newBalance = parseFloat(user.balance) - withdrawAmount;
        await db.execute('UPDATE bank_users SET balance = ? WHERE uname = ?', [newBalance, req.user.sub]);

        const timestamp = new Date().toISOString();
        await db.execute(
            'INSERT INTO bank_transactions (user, other_user, amount, type, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.sub, 'Self', withdrawAmount, 'DEBIT', description || 'Withdrawal', timestamp]
        );

        res.status(200).json({ message: 'Withdrawal successful', newBalance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during withdrawal' });
    }
});

// TRANSFER
app.post('/transfer', requireAuth, async (req, res) => {
    const { recipient, amount, description } = req.body;
    const transferAmount = parseFloat(amount);

    if (!recipient || isNaN(transferAmount) || transferAmount <= 0)
        return res.status(400).json({ message: 'Invalid recipient or amount' });

    try {
        const [senderRows] = await db.pool.execute('SELECT uname, balance FROM bank_users WHERE uname = ?', [req.user.sub]);
        const [receiverRows] = await db.pool.execute('SELECT uname, balance FROM bank_users WHERE uname = ?', [recipient]);

        const sender = senderRows[0];
        const receiver = receiverRows[0];

        if (!receiver) return res.status(404).json({ message: 'Recipient not found' });
        if (sender.uname === receiver.uname) return res.status(400).json({ message: 'Cannot transfer to yourself' });
        if (parseFloat(sender.balance) < transferAmount) return res.status(400).json({ message: 'Insufficient balance' });

        const timestamp = new Date().toISOString();
        const desc = description || `Transfer to ${receiver.uname}`;

        // Perform transaction (ideally this should be an actual SQL transaction)
        await db.execute('UPDATE bank_users SET balance = balance - ? WHERE uname = ?', [transferAmount, sender.uname]);
        await db.execute('UPDATE bank_users SET balance = balance + ? WHERE uname = ?', [transferAmount, receiver.uname]);

        await db.execute(
            'INSERT INTO bank_transactions (user, other_user, amount, type, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [sender.uname, receiver.uname, transferAmount, 'DEBIT', desc, timestamp]
        );
        await db.execute(
            'INSERT INTO bank_transactions (user, other_user, amount, type, description, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
            [receiver.uname, sender.uname, transferAmount, 'CREDIT', `Transfer from ${sender.uname}`, timestamp]
        );

        const [newBalRows] = await db.pool.execute('SELECT balance FROM bank_users WHERE uname = ?', [sender.uname]);
        res.status(200).json({ message: 'Transfer successful', newBalance: newBalRows[0].balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during transfer' });
    }
});

// Route moved up

// TRANSACTIONS (original route)
app.get('/bank_transactions', requireAuth, async (req, res) => {
    try {
        const userTransactions = await db.execute(
            'SELECT * FROM bank_transactions WHERE user = ? ORDER BY timestamp DESC',
            [req.user.sub]
        );
        res.json({ bank_transactions: userTransactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching bank_transactions' });
    }
});

app.use((req, res) => {
    console.log(`[404 NOT FOUND] ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Route not found', path: req.url, method: req.method });
});

module.exports = app; // For Vercel environment

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
