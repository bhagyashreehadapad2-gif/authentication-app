import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const TransactionPage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('transfer');
    const navigate = useNavigate();

    // Form states
    const [transferForm, setTransferForm] = useState({ recipient: '', amount: '', description: '' });
    const [depositForm, setDepositForm] = useState({ amount: '', description: '' });
    const [withdrawForm, setWithdrawForm] = useState({ amount: '', description: '' });

    const [status, setStatus] = useState({ type: '', msg: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/me`, { withCredentials: true })
            .then(res => { setUser(res.data.user); setLoading(false); })
            .catch(() => navigate('/login'));
    }, [navigate]);

    const showStatus = (type, msg) => {
        setStatus({ type, msg });
        setTimeout(() => setStatus({ type: '', msg: '' }), 4000);
    };

    const refreshBalance = async () => {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/me`, { withCredentials: true });
        setUser(res.data.user);
    };

    const handleTransfer = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/transfer`, transferForm, { withCredentials: true });
            await refreshBalance();
            showStatus('success', `₹${transferForm.amount} transferred to ${transferForm.recipient} successfully!`);
            setTransferForm({ recipient: '', amount: '', description: '' });
        } catch (err) {
            showStatus('error', err.response?.data?.message || 'Transfer failed');
        } finally { setSubmitting(false); }
    };

    const handleDeposit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/deposit`, depositForm, { withCredentials: true });
            await refreshBalance();
            showStatus('success', `₹${depositForm.amount} deposited successfully!`);
            setDepositForm({ amount: '', description: '' });
        } catch (err) {
            showStatus('error', err.response?.data?.message || 'Deposit failed');
        } finally { setSubmitting(false); }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/withdraw`, withdrawForm, { withCredentials: true });
            await refreshBalance();
            showStatus('success', `₹${withdrawForm.amount} withdrawn successfully!`);
            setWithdrawForm({ amount: '', description: '' });
        } catch (err) {
            showStatus('error', err.response?.data?.message || 'Withdrawal failed');
        } finally { setSubmitting(false); }
    };

    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

    if (loading) return (
        <div className="app-shell">
            <div className="loading-screen"><div className="spinner"></div></div>
        </div>
    );

    return (
        <div className="app-shell">
            <Navbar user={user} />
            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Transactions</h1>
                        <p className="page-subtitle">Transfer, Deposit, or Withdraw funds</p>
                    </div>
                    <div className="balance-pill">
                        Balance: <strong>{fmt(user?.balance || 0)}</strong>
                    </div>
                </div>

                {/* Status Message */}
                {status.msg && (
                    <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                        {status.type === 'success' ? '✅' : '❌'} {status.msg}
                    </div>
                )}

                {/* Tabs */}
                <div className="tab-bar">
                    <button className={`tab-btn ${activeTab === 'transfer' ? 'tab-active' : ''}`} onClick={() => setActiveTab('transfer')}>
                        💸 Transfer Money
                    </button>
                    <button className={`tab-btn ${activeTab === 'deposit' ? 'tab-active' : ''}`} onClick={() => setActiveTab('deposit')}>
                        📥 Deposit
                    </button>
                    <button className={`tab-btn ${activeTab === 'withdraw' ? 'tab-active' : ''}`} onClick={() => setActiveTab('withdraw')}>
                        📤 Withdraw
                    </button>
                </div>

                <div className="section-card form-card">
                    {/* TRANSFER */}
                    {activeTab === 'transfer' && (
                        <form onSubmit={handleTransfer} className="bank-form">
                            <div className="form-intro">
                                <span className="form-icon">💸</span>
                                <div>
                                    <h2>Transfer Money</h2>
                                    <p>Send funds to any NestBank account holder</p>
                                </div>
                            </div>
                            <div className="hint-box">
                                💡 <strong>Demo users:</strong> Transfer to <code>demo1</code> or <code>demo2</code> (both pre-loaded with funds)
                            </div>
                            <div className="form-group">
                                <label>Recipient Username</label>
                                <input type="text" placeholder="e.g. demo1" value={transferForm.recipient}
                                    onChange={e => setTransferForm({ ...transferForm, recipient: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" placeholder="0.00" min="1" step="0.01" value={transferForm.amount}
                                    onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <input type="text" placeholder="e.g. Rent payment" value={transferForm.description}
                                    onChange={e => setTransferForm({ ...transferForm, description: e.target.value })} />
                            </div>
                            <button type="submit" className="submit-btn" disabled={submitting}>
                                {submitting ? 'Processing...' : '💸 Send Money'}
                            </button>
                        </form>
                    )}

                    {/* DEPOSIT */}
                    {activeTab === 'deposit' && (
                        <form onSubmit={handleDeposit} className="bank-form">
                            <div className="form-intro">
                                <span className="form-icon">📥</span>
                                <div>
                                    <h2>Deposit Funds</h2>
                                    <p>Add money to your NestBank account</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" placeholder="0.00" min="1" max="1000000" step="0.01" value={depositForm.amount}
                                    onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <input type="text" placeholder="e.g. Salary credit" value={depositForm.description}
                                    onChange={e => setDepositForm({ ...depositForm, description: e.target.value })} />
                            </div>
                            <button type="submit" className="submit-btn deposit-btn" disabled={submitting}>
                                {submitting ? 'Processing...' : '📥 Deposit Now'}
                            </button>
                        </form>
                    )}

                    {/* WITHDRAW */}
                    {activeTab === 'withdraw' && (
                        <form onSubmit={handleWithdraw} className="bank-form">
                            <div className="form-intro">
                                <span className="form-icon">📤</span>
                                <div>
                                    <h2>Withdraw Funds</h2>
                                    <p>Withdraw money from your account</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" placeholder="0.00" min="1" step="0.01" value={withdrawForm.amount}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <input type="text" placeholder="e.g. ATM withdrawal" value={withdrawForm.description}
                                    onChange={e => setWithdrawForm({ ...withdrawForm, description: e.target.value })} />
                            </div>
                            <div className="balance-pill" style={{ marginBottom: '1rem' }}>
                                Available Balance: <strong>{fmt(user?.balance || 0)}</strong>
                            </div>
                            <button type="submit" className="submit-btn withdraw-btn" disabled={submitting}>
                                {submitting ? 'Processing...' : '📤 Withdraw Now'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TransactionPage;
