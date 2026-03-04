import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({ username: '', email: '', phone: '', password: '' });
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
            await axios.post(`${apiUrl}/register`, formData);
            navigate('/login');
        } catch (err) {
            console.error('Registration Failed:', err.response?.data || err.message);
            const status = err.response?.status ? ` (Status: ${err.response.status})` : '';
            setError((err.response?.data?.message || 'Registration failed') + status);
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

                <h1>Open Account</h1>
                <p className="subtitle">Join NestBank — your account starts with ₹10,000</p>

                {error && <p style={{ color: '#f87171', textAlign: 'center', marginBottom: '1rem', fontSize: '0.875rem' }}>⚠️ {error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text" name="username" placeholder="johndoe" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" placeholder="john@example.com" onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" placeholder="+91 98765 43210" onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Creating Account...' : '🏦 Open Account'}
                    </button>
                </form>

                <div className="footer-link">
                    Already a customer? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
