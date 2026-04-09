import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './context/ToastContext';
import Overview from './pages/Overview';
import UsersRegistry from './pages/UsersRegistry';
import Subjects from './pages/Subjects';
import Timetable from './pages/Timetable';
import Notices from './pages/Notices';
import Blueprint from './pages/Blueprint';
import Issues from './pages/Issues';

// Check if token looks valid (exists + not expired)
function isTokenValid() {
    const token = localStorage.getItem('sc_token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'Admin') return false;
        if (payload.exp && payload.exp * 1000 < Date.now()) return false;
        return true;
    } catch { return false; }
}

function App() {
    const [ready, setReady] = useState(isTokenValid());

    useEffect(() => {
        if (ready) return;
        // Auto-authenticate by fetching a fresh admin token from the API
        fetch('/api/auto-login-token')
            .then(r => r.json())
            .then(data => {
                if (data.token) {
                    localStorage.setItem('sc_token', data.token);
                    localStorage.setItem('sc_role', 'Admin');
                    localStorage.setItem('role', 'Admin');
                    setReady(true);
                }
            })
            .catch(() => {
                // Fallback: redirect to the HTML auto-login page
                window.location.href = '/auto-login';
            });
    }, [ready]);

    if (!ready) {
        return (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0B1120', color:'#E2E8F0', fontFamily:'Inter, sans-serif' }}>
                <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Authenticating…</div>
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>Establishing secure admin session</div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <ToastProvider>
                <div className="dashboard-container">
                    <Sidebar />
                    <div className="main-wrapper">
                        <header className="top-header">
                            <div className="admin-profile">
                                <div className="initial-circle">SA</div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-text)' }}>System Admin</div>
                                    <div style={{ fontSize: 10, color: 'var(--secondary-text)' }}>Root Privileges</div>
                                </div>
                            </div>
                        </header>
                        <div className="page-content">
                            <Routes>
                                <Route path="/admin-dashboard" element={<Overview />} />
                                <Route path="/users" element={<UsersRegistry />} />
                                <Route path="/subjects" element={<Subjects />} />
                                <Route path="/timetable" element={<Timetable />} />
                                <Route path="/notices" element={<Notices />} />
                                <Route path="/blueprint" element={<Blueprint />} />
                                <Route path="/issues" element={<Issues />} />
                                <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
                                <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
                            </Routes>
                        </div>
                    </div>
                </div>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
