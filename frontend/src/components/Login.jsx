import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            console.log('Sending login request to:', `${apiUrl}/login`);
            const res = await axios.post(`${apiUrl}/login`, formData, { withCredentials: true });
            console.log('Login Response:', res.status, res.data);
            navigate('/dashboard');
        } catch (err) {
            console.error('Login Failed:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="container">
                <div className="auth-logo">
                    <span className="auth-logo-icon">🏦</span>
                    <span className="auth-logo-name">NestBank</span>
                </div>

                <h1>Welcome Back</h1>
                <p className="subtitle">Sign in to your account</p>

                {error && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" name="username" placeholder="johndoe" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : '🔐 Sign In'}
                    </button>
                </form>

                <div className="footer-link">
                    Don't have an account? <Link to="/">Create Account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
