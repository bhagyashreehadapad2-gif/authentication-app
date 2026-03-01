import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('http://localhost:5000/me', {
                    withCredentials: true
                });
                setUser(res.data.user);
            } catch (err) {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (err) {
            console.error('Logout failed');
        }
    };

    if (loading) return <div className="container"><h1>Loading...</h1></div>;

    return (
        <div className="dashboard">
            <div className="welcome-card">
                <h1>Welcome to KodNest Application</h1>
                {user && (
                    <p className="subtitle" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
                        Hello, <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{user.username}</span>!
                    </p>
                )}
                <p className="subtitle">You have successfully logged into your secure dashboard.</p>

                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
