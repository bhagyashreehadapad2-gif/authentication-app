const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function verify() {
    console.log('--- Starting Backend Verification ---');

    try {
        // 1. Test Registration
        console.log('\nTesting /register...');
        const regRes = await axios.post(`${BASE_URL}/register`, {
            username: 'testuser_verify',
            email: 'verify@example.com',
            phone: '1234567890',
            password: 'password123'
        });
        console.log('Registration Status:', regRes.status, regRes.data.message);

        // 2. Test Login
        console.log('\nTesting /login...');
        const loginRes = await axios.post(`${BASE_URL}/login`, {
            username: 'testuser_verify',
            password: 'password123'
        });
        console.log('Login Status:', loginRes.status, loginRes.data.message);

        const cookie = loginRes.headers['set-cookie'];
        console.log('Cookie received:', cookie ? 'Yes' : 'No');

        // 3. Test /me (Protected Route)
        if (cookie) {
            console.log('\nTesting /me (Protected)...');
            const meRes = await axios.get(`${BASE_URL}/me`, {
                headers: { Cookie: cookie[0] }
            });
            console.log('Me Status:', meRes.status, 'User:', meRes.data.user.sub);

            // 4. Test /balance
            console.log('\nTesting /balance...');
            const balanceRes = await axios.get(`${BASE_URL}/balance`, {
                headers: { Cookie: cookie[0] }
            });
            console.log('Balance Status:', balanceRes.status, 'Balance:', balanceRes.data.balance);
        }

        // 5. Test Logout
        console.log('\nTesting /logout...');
        const logoutRes = await axios.post(`${BASE_URL}/logout`, {}, {
            headers: { Cookie: cookie ? cookie[0] : '' }
        });
        console.log('Logout Status:', logoutRes.status, logoutRes.data.message);

        console.log('\n--- Verification Complete ---');
    } catch (err) {
        console.error('Verification failed:', err.response?.data || err.message);
    }
}

verify();
