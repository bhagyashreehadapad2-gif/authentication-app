import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const HistoryPage = () => {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [filter, setFilter] = useState('ALL');
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
            } catch {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
    const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter);

    const totalCredit = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const totalDebit = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

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
                        <h1 className="page-title">Transaction History</h1>
                        <p className="page-subtitle">All your account activity</p>
                    </div>
                </div>

                {/* Summary Row */}
                <div className="history-summary">
                    <div className="summary-pill credit-pill">
                        <span>Total Credits</span>
                        <strong className="credit-text">{fmt(totalCredit)}</strong>
                    </div>
                    <div className="summary-pill debit-pill">
                        <span>Total Debits</span>
                        <strong className="debit-text">{fmt(totalDebit)}</strong>
                    </div>
                    <div className="summary-pill">
                        <span>Net Flow</span>
                        <strong className={totalCredit - totalDebit >= 0 ? 'credit-text' : 'debit-text'}>
                            {fmt(totalCredit - totalDebit)}
                        </strong>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="filter-bar">
                    <span className="filter-label">Filter:</span>
                    {['ALL', 'CREDIT', 'DEBIT'].map(f => (
                        <button key={f}
                            className={`filter-btn ${filter === f ? `filter-active-${f.toLowerCase()}` : ''}`}
                            onClick={() => setFilter(f)}>
                            {f === 'ALL' ? '🔄 All' : f === 'CREDIT' ? '📈 Credits' : '📉 Debits'}
                            &nbsp;
                            <span className="filter-count">
                                ({f === 'ALL' ? transactions.length : transactions.filter(t => t.type === f).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Transactions Table */}
                <div className="section-card table-card">
                    {filtered.length === 0 ? (
                        <div className="empty-state">
                            <span>📭</span>
                            <p>No {filter !== 'ALL' ? filter.toLowerCase() : ''} transactions found.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="txn-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date & Time</th>
                                        <th>Description</th>
                                        <th>Party</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t, i) => (
                                        <tr key={t.id}>
                                            <td className="txn-num">{i + 1}</td>
                                            <td className="txn-date-cell">{fmtDate(t.timestamp)}</td>
                                            <td className="txn-desc-cell">{t.description}</td>
                                            <td className="txn-party">{t.other_user}</td>
                                            <td>
                                                <span className={`badge ${t.type === 'CREDIT' ? 'badge-credit' : 'badge-debit'}`}>
                                                    {t.type === 'CREDIT' ? '↓ CREDIT' : '↑ DEBIT'}
                                                </span>
                                            </td>
                                            <td className={`txn-amount-cell ${t.type === 'CREDIT' ? 'credit-text' : 'debit-text'}`}>
                                                {t.type === 'CREDIT' ? '+' : '-'}{fmt(t.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default HistoryPage;
