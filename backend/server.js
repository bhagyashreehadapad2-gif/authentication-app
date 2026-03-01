const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// In-Memory Database
const users = [];
const transactions = [];

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Helper: generate a mock account number
const generateAccountNumber = (uid) => `4000${String(uid).padStart(8, '0')}`;

// Seed 2 demo users on startup
const seedDemoUsers = async () => {
    const demoAccounts = [
        { username: 'demo1', email: 'demo1@bank.com', phone: '9876543210', password: 'demo123', balance: 25000.00 },
        { username: 'demo2', email: 'demo2@bank.com', phone: '9876543211', password: 'demo123', balance: 15000.00 }
    ];
    for (const acc of demoAccounts) {
        const hashedPassword = await bcrypt.hash(acc.password, 10);
        const uid = users.length + 1;
        users.push({
            uid,
            uname: acc.username,
            email: acc.email,
            phone: acc.phone,
            password: hashedPassword,
            role: 'USER',
            balance: acc.balance,
            accountNumber: generateAccountNumber(uid)
        });
    }
    console.log('Demo users seeded: demo1 / demo2 (password: demo123)');
};
seedDemoUsers();

// ─── Middleware: Auth Guard ────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// REGISTER
app.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Missing required fields' });

        if (users.find(u => u.uname === username))
            return res.status(409).json({ message: 'Username already taken' });

        if (users.find(u => u.email === email))
            return res.status(409).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = users.length + 1;
        const newUser = {
            uid,
            uname: username,
            email,
            phone: phone || '',
            password: hashedPassword,
            role: 'USER',
            balance: 10000.00, // Starting balance ₹10,000
            accountNumber: generateAccountNumber(uid)
        };
        users.push(newUser);
        console.log(`User registered: ${username} (uid: ${uid})`);
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
        const user = users.find(u => u.uname === username);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { sub: user.uname, role: user.role },
            JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

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
app.get('/me', requireAuth, (req, res) => {
    const user = users.find(u => u.uname === req.user.sub);
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
app.get('/balance', requireAuth, (req, res) => {
    const user = users.find(u => u.uname === req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ balance: user.balance, accountNumber: user.accountNumber });
});

// DEPOSIT
app.post('/deposit', requireAuth, (req, res) => {
    const { amount, description } = req.body;
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount <= 0)
        return res.status(400).json({ message: 'Invalid deposit amount' });
    if (depositAmount > 1000000)
        return res.status(400).json({ message: 'Maximum deposit limit is ₹10,00,000' });

    const user = users.find(u => u.uname === req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.balance += depositAmount;
    const timestamp = new Date().toISOString();

    transactions.push({
        id: transactions.length + 1,
        user: user.uname,
        other_user: 'Self',
        amount: depositAmount,
        type: 'CREDIT',
        description: description || 'Deposit',
        timestamp
    });

    res.status(200).json({ message: 'Deposit successful', newBalance: user.balance });
});

// WITHDRAW
app.post('/withdraw', requireAuth, (req, res) => {
    const { amount, description } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0)
        return res.status(400).json({ message: 'Invalid withdrawal amount' });

    const user = users.find(u => u.uname === req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.balance < withdrawAmount)
        return res.status(400).json({ message: 'Insufficient balance' });

    user.balance -= withdrawAmount;
    const timestamp = new Date().toISOString();

    transactions.push({
        id: transactions.length + 1,
        user: user.uname,
        other_user: 'Self',
        amount: withdrawAmount,
        type: 'DEBIT',
        description: description || 'Withdrawal',
        timestamp
    });

    res.status(200).json({ message: 'Withdrawal successful', newBalance: user.balance });
});

// TRANSFER
app.post('/transfer', requireAuth, (req, res) => {
    const { recipient, amount, description } = req.body;
    const transferAmount = parseFloat(amount);

    if (!recipient || isNaN(transferAmount) || transferAmount <= 0)
        return res.status(400).json({ message: 'Invalid recipient or amount' });

    const sender = users.find(u => u.uname === req.user.sub);
    const receiver = users.find(u => u.uname === recipient);

    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });
    if (sender.uname === receiver.uname) return res.status(400).json({ message: 'Cannot transfer to yourself' });
    if (sender.balance < transferAmount) return res.status(400).json({ message: 'Insufficient balance' });

    sender.balance -= transferAmount;
    receiver.balance += transferAmount;

    const timestamp = new Date().toISOString();
    const desc = description || `Transfer to ${receiver.uname}`;

    transactions.push({
        id: transactions.length + 1,
        user: sender.uname,
        other_user: receiver.uname,
        amount: transferAmount,
        type: 'DEBIT',
        description: desc,
        timestamp
    });
    transactions.push({
        id: transactions.length + 1,
        user: receiver.uname,
        other_user: sender.uname,
        amount: transferAmount,
        type: 'CREDIT',
        description: `Transfer from ${sender.uname}`,
        timestamp
    });

    res.status(200).json({ message: 'Transfer successful', newBalance: sender.balance });
});

// TRANSACTIONS
app.get('/transactions', requireAuth, (req, res) => {
    const userTransactions = transactions
        .filter(t => t.user === req.user.sub)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json({ transactions: userTransactions });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
