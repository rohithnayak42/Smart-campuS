import React from 'react';
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

function App() {
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
