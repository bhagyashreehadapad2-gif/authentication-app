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

// Mock Database (since Aiven connection issues persist)
const users = [];

// JWT Config
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Routes
app.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Role is automatically assigned
        const role = 'USER';

        const hashedPassword = await bcrypt.hash(password, 10);

        // Schema: uid, uname, email, phone, password, role
        const newUser = {
            uid: users.length + 1,
            uname: username,
            email,
            phone,
            password: hashedPassword,
            role
        };

        users.push(newUser);
        console.log(`User registered: ${username} (uid: ${newUser.uid})`);

        res.status(201).json({ message: 'Register success' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = users.find(u => u.uname === username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // JWT Payload: sub, role, iat, exp
        const payload = {
            sub: user.uname,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: 'HS256',
            expiresIn: '24h'
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Added Strict as per requirement
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
});

app.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
