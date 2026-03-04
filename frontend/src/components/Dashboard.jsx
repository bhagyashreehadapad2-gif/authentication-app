import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || '/api';
                const [meRes, txRes] = await Promise.all([
                    axios.get(`${apiUrl}/me`, { withCredentials: true }),
                    axios.get(`${apiUrl}/transactions`, { withCredentials: true })
                ]);
                setUser(meRes.data.user);
                setTransactions(txRes.data.transactions || []);
                console.log('Dashboard data fetched successfully:', meRes.data.user);
            } catch (err) {
                console.error('Dashboard fetch error:', err.response?.data || err.message);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    if (loading) return (
        <div className="app-shell">
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading your account...</p>
            </div>
        </div>
    );

    const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const recent = transactions.slice(0, 5);

    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
    const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="app-shell">
            <Navbar user={user} />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Good Day, {user?.username}! 👋</h1>
                        <p className="page-subtitle">Here's your financial overview</p>
                    </div>
                    <div className="account-badge">
                        <span className="account-label">A/C No.</span>
                        <span className="account-number">{user?.accountNumber}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card balance-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                            <span className="stat-label">Current Balance</span>
                            <span className="stat-value">{fmt(user?.balance || 0)}</span>
                        </div>
                    </div>
                    <div className="stat-card credit-card-stat">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Credited</span>
                            <span className="stat-value credit-text">{fmt(totalCredit)}</span>
                        </div>
                    </div>
                    <div className="stat-card debit-card-stat">
                        <div className="stat-icon">📉</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Debited</span>
                            <span className="stat-value debit-text">{fmt(totalDebit)}</span>
                        </div>
                    </div>
                    <div className="stat-card txn-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-info">
                            <span className="stat-label">Total Transactions</span>
                            <span className="stat-value">{transactions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="section-card">
                    <div className="section-header">
                        <h2 className="section-title">Recent Transactions</h2>
                        <button className="link-btn" onClick={() => navigate('/history')}>View All →</button>
                    </div>

                    {recent.length === 0 ? (
                        <div className="empty-state">
                            <span>🏦</span>
                            <p>No transactions yet. Start by making a deposit!</p>
                        </div>
                    ) : (
                        <div className="txn-list">
                            {recent.map(t => (
                                <div className="txn-row" key={t.id}>
                                    <div className={`txn-type-icon ${t.type === 'CREDIT' ? 'credit-icon' : 'debit-icon'}`}>
                                        {t.type === 'CREDIT' ? '↓' : '↑'}
                                    </div>
                                    <div className="txn-details">
                                        <span className="txn-desc">{t.description}</span>
                                        <span className="txn-date">{fmtDate(t.timestamp)}</span>
                                    </div>
                                    <span className={`txn-amount ${t.type === 'CREDIT' ? 'credit-text' : 'debit-text'}`}>
                                        {t.type === 'CREDIT' ? '+' : '-'}{fmt(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Account Details */}
                <div className="section-card">
                    <h2 className="section-title">Account Details</h2>
                    <div className="details-grid">
                        <div className="detail-item">
                            <span className="detail-label">Account Holder</span>
                            <span className="detail-value">{user?.username}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{user?.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{user?.phone || '—'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Account Type</span>
                            <span className="detail-value">Savings Account</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">IFSC Code</span>
                            <span className="detail-value">NEST0001234</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Status</span>
                            <span className="detail-value status-active">● Active</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
