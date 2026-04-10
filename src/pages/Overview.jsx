import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Users, BookOpen, Calendar, Bell, LifeBuoy, Shield, UserPlus } from 'lucide-react';

const Overview = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSubjects: 0,
        totalSlots: 0,
        totalNotices: 0,
        totalIssues: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const showToast = useToast();

    useEffect(() => {
        if (!localStorage.getItem('sc_token')) {
            window.location.href = '/auth.html';
            return;
        }

        const fetchStats = async () => {
            try {
                const headers = {
                    'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
                };

                const [users, subjects, slots, notices, issues] = await Promise.all([
                    fetch("/api/users", { headers }).then(res => res.json()),
                    fetch("/api/subjects", { headers }).then(res => res.json()),
                    fetch("/api/timetable", { headers }).then(res => res.json()),
                    fetch("/api/notices", { headers }).then(res => res.json()),
                    fetch("/api/issues", { headers }).then(res => res.json())
                ]);

                setStats({
                    totalUsers: users.length || 0,
                    totalSubjects: subjects.length || 0,
                    totalSlots: slots.length || 0,
                    totalNotices: notices.length || 0,
                    totalIssues: issues.length || 0
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                showToast('⚠️ Could not load real-time stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { label: 'Total Users', val: stats.totalUsers, Icon: Users, color: 'color-blue', path: '/users' },
        { label: 'Subjects Portfolio', val: stats.totalSubjects, Icon: BookOpen, color: 'color-purple', path: '/subjects' },
        { label: 'Schedule Slots', val: stats.totalSlots, Icon: Calendar, color: 'color-green', path: '/timetable' },
        { label: 'Live Notices', val: stats.totalNotices, Icon: Bell, color: 'color-yellow', path: '/notices' },
        { label: 'Open Issues', val: stats.totalIssues, Icon: LifeBuoy, color: 'color-red', path: '/issues' },
    ];

    return (
        <>
            <div className="card-grid">
                {cards.map((c, i) => (
                    <div className="soft-card" key={i} onClick={() => navigate(c.path)}>
                        <div className={`icon-circle ${c.color}`}><c.Icon size={22} /></div>
                        <div className="card-val">
                            <h2>{loading ? '—' : (c.val || 0)}</h2>
                        </div>
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
