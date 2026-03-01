import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ user }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch {
            navigate('/login');
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span className="logo-icon">🏦</span>
                <span className="logo-text">NestBank</span>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
                <div>
                    <div className="user-name">{user?.username || 'User'}</div>
                    <div className="user-role">Personal Account</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">💸</span>
                    <span>Transactions</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">📋</span>
                    <span>History</span>
                </NavLink>
            </nav>

            <button className="sidebar-logout" onClick={handleLogout}>
                <span>🚪</span>
                <span>Logout</span>
            </button>
        </aside>
    );
};

export default Navbar;
