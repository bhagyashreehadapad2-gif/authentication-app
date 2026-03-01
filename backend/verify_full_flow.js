const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const clientA = axios.create({ baseURL: BASE_URL, withCredentials: true });
const clientB = axios.create({ baseURL: BASE_URL, withCredentials: true });

async function verify() {
    console.log('--- Starting Full Flow Verification ---');

    try {
        // 1. Create User A and User B
        console.log('\nRegistering User A (Alice) and User B (Bob)...');
        await clientA.post('/register', { username: 'alice', email: 'alice@bank.com', phone: '111', password: 'password123' });
        await clientB.post('/register', { username: 'bob', email: 'bob@bank.com', phone: '222', password: 'password123' });

        // 2. Login User A
        console.log('\nLogging in Alice...');
        const loginA = await clientA.post('/login', { username: 'alice', password: 'password123' });
        const cookieA = loginA.headers['set-cookie'][0];
        clientA.defaults.headers.Cookie = cookieA;

        // 3. Check Alice Balance
        const balA = await clientA.get('/balance');
        console.log('Alice initial balance:', balA.data.balance);

        // 4. Alice transfers to Bob
        const transferAmt = 100.50;
        console.log(`\nAlice transferring $${transferAmt} to Bob...`);
        const transRes = await clientA.post('/transfer', { recipient: 'bob', amount: transferAmt });
        console.log('Transfer Status:', transRes.status, transRes.data.message);

        // 5. Verify Alice History
        console.log('\nAlice Transaction History:');
        const histA = await clientA.get('/transactions');
        histA.data.transactions.forEach(t => {
            console.log(`- ${t.timestamp}: ${t.type} $${t.amount} (${t.other_user})`);
        });

        // 6. Login User B and Verify
        console.log('\nLogging in Bob...');
        const loginB = await clientB.post('/login', { username: 'bob', password: 'password123' });
        const cookieB = loginB.headers['set-cookie'][0];
        clientB.defaults.headers.Cookie = cookieB;

        console.log('\nBob Transaction History:');
        const histB = await clientB.get('/transactions');
        histB.data.transactions.forEach(t => {
            console.log(`- ${t.timestamp}: ${t.type} $${t.amount} (${t.other_user})`);
        });

        console.log('\n--- Verification Complete ---');
    } catch (err) {
        console.error('Verification failed:', err.response?.data || err.message);
    }
}

verify();
