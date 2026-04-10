import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Users, BookOpen, Calendar, Bell, LifeBuoy, Shield, UserPlus } from 'lucide-react';

const Overview = () => {
    const [stats, setStats] = useState({ users: 0, subjects: 0, notices: 0, issues: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const showToast = useToast();

    useEffect(() => {
        api.getStats()
            .then(data => setStats(data))
            .catch(() => showToast('⚠️ Could not load stats'))
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        { label: 'Total Users',       val: stats.users,    Icon: Users,    color: 'color-blue',   path: '/users' },
        { label: 'Subjects Portfolio', val: stats.subjects, Icon: BookOpen, color: 'color-purple', path: '/subjects' },
        { label: 'Schedule Slots',    val: 24,             Icon: Calendar, color: 'color-green',  path: '/timetable' },
        { label: 'Live Notices',      val: stats.notices,  Icon: Bell,     color: 'color-yellow', path: '/notices' },
        { label: 'Open Issues',       val: stats.issues,   Icon: LifeBuoy, color: 'color-red',    path: '/issues' },
    ];

    return (
        <>
            <div className="card-grid">
                {cards.map((c, i) => (
                    <div className="soft-card" key={i} onClick={() => navigate(c.path)}>
                        <div className={`icon-circle ${c.color}`}><c.Icon size={22} /></div>
                        <div className="card-val">{loading ? '—' : c.val}</div>
                        <div className="card-label">{c.label}</div>
                    </div>
                ))}
            </div>

            <div className="split-layout">
                <div className="content-box">
                    <h2 className="section-title">Operational Activity</h2>
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--secondary-text)' }}>
                        <Shield size={32} style={{ opacity: .2, marginBottom: 10 }} />
                        <p style={{ fontSize: 13 }}>System nodes operational. No critical activity logged.</p>
                    </div>
                </div>
                <div className="content-box">
                    <h2 className="section-title">Quick Actions</h2>
                    <div style={{ display: 'grid', gap: 10 }}>
                        <button className="btn-primary" onClick={() => navigate('/users?openModal=true')}>
                            <UserPlus size={16} /> Onboard New User
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/notices')}>Publish Announcement</button>
                        <button className="btn-secondary" style={{ background:'#F1F5F9', color:'var(--primary-text)' }} onClick={() => navigate('/subjects')}>Add Curriculum</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Overview;
