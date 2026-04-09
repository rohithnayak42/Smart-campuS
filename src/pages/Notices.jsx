import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Bell, Send, Clock, Users, X, Trash2, AlertTriangle } from 'lucide-react';

const DURATION_OPTIONS = [
    { label: '1 Hour', hours: 1 },
    { label: '6 Hours', hours: 6 },
    { label: '12 Hours', hours: 12 },
    { label: '24 Hours', hours: 24 },
    { label: '2 Days', hours: 48 },
    { label: '3 Days', hours: 72 },
    { label: '7 Days', hours: 168 },
    { label: 'No Expiry', hours: 0 },
];

const AUDIENCE_OPTIONS = ['Everyone', 'Students', 'Staff / Faculty', 'Workers', 'Guards'];

function getTimeRemaining(expiresAt) {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { expired: true, text: 'Expired' };
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return { expired: false, text: `Expires in ${mins}m` };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { expired: false, text: `Expires in ${hrs}h ${mins % 60}m` };
    const days = Math.floor(hrs / 24);
    return { expired: false, text: `Expires in ${days}d ${hrs % 24}h` };
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const Notices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(24);
    const [selectedAudience, setSelectedAudience] = useState(['Everyone']);
    const [, setTick] = useState(0); // for re-rendering countdown timers
    const showToast = useToast();

    useEffect(() => { loadNotices(); }, []);

    // Refresh countdown timers every minute
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(interval);
    }, []);

    const loadNotices = async () => {
        try { setNotices(await api.getNotices()); }
        catch { showToast('⚠️ Could not load notices'); }
        finally { setLoading(false); }
    };

    const toggleAudience = useCallback((aud) => {
        setSelectedAudience(prev => {
            if (aud === 'Everyone') return ['Everyone'];
            const without = prev.filter(a => a !== 'Everyone');
            if (without.includes(aud)) {
                const result = without.filter(a => a !== aud);
                return result.length === 0 ? ['Everyone'] : result;
            }
            return [...without, aud];
        });
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        const data = {
            title: fd.get('title'),
            message: fd.get('message'),
            target_roles: selectedAudience.join(', '),
            duration_hours: selectedDuration
        };
        try {
            await api.createNotice(data);
            showToast('✅ Notice published successfully');
            setShowAdd(false);
            setSelectedDuration(24);
            setSelectedAudience(['Everyone']);
            e.target.reset();
            loadNotices();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this notice?')) return;
        try {
            await fetch(`/api/admin/notices/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sc_token')}`
                }
            });
            showToast('✅ Notice removed');
            loadNotices();
        } catch { showToast('⚠️ Delete failed'); }
    };

    // Separate active vs expired notices
    const activeNotices = notices.filter(n => {
        if (!n.expires_at) return true;
        return new Date(n.expires_at).getTime() > Date.now();
    });
    const expiredNotices = notices.filter(n => {
        if (!n.expires_at) return false;
        return new Date(n.expires_at).getTime() <= Date.now();
    });

    return (
        <>
            {/* Page Hero */}
            <div className="page-hero">
                <div>
                    <h2>Campus Notices</h2>
                    <p>Broadcast announcements and time-sensitive updates to your campus community.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? <><X size={16} /> Close Form</> : <><Send size={16} /> Publish Notice</>}
                </button>
            </div>

            {/* Inline Post Form */}
            {showAdd && (
                <div className="inline-form-card notice-form-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div className="icon-circle color-yellow" style={{ width: 34, height: 34, marginBottom: 0 }}>
                            <Bell size={16} />
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: 16 }}>Post New Notice</h3>
                    </div>
                    <form onSubmit={handleAdd}>
                        {/* Title */}
                        <div className="notice-form-section">
                            <label className="form-label">Notice Title</label>
                            <input name="title" className="form-input" placeholder="e.g. Semester Exam Schedule Announced" required />
                        </div>

                        {/* Target Audience */}
                        <div className="notice-form-section">
                            <label className="form-label">Target Audience <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select one or more)</span></label>
                            <div className="audience-pills">
                                {AUDIENCE_OPTIONS.map(aud => (
                                    <button
                                        key={aud}
                                        type="button"
                                        className={`audience-pill ${selectedAudience.includes(aud) ? 'active' : ''}`}
                                        onClick={() => toggleAudience(aud)}
                                    >
                                        {aud === 'Everyone' && <Users size={12} />}
                                        {aud}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Display Duration */}
                        <div className="notice-form-section">
                            <label className="form-label">
                                <Clock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                                Display Duration
                            </label>
                            <div className="duration-selector">
                                {DURATION_OPTIONS.map(opt => (
                                    <button
                                        key={opt.hours}
                                        type="button"
                                        className={`duration-chip ${selectedDuration === opt.hours ? 'active' : ''}`}
                                        onClick={() => setSelectedDuration(opt.hours)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="notice-form-section">
                            <label className="form-label">Content</label>
                            <textarea name="message" className="form-input" placeholder="Write the notice content here..." rows="4" required style={{ resize: 'vertical' }} />
                        </div>

                        {/* Submit */}
                        <button type="submit" className="btn-primary notice-submit-btn" disabled={submitting}>
                            <Send size={14} />
                            {submitting ? 'Publishing…' : 'Post Notice'}
                        </button>
                    </form>
                </div>
            )}

            {/* Active Notices */}
            {loading ? (
                <div className="empty-state"><p>Loading notices…</p></div>
            ) : activeNotices.length === 0 && expiredNotices.length === 0 ? (
                <div className="empty-state">
                    <Bell size={40} style={{ opacity: .15, marginBottom: 8 }} />
                    <p>No notices published yet.</p>
                </div>
            ) : (
                <div className="notices-list">
                    {activeNotices.map((n, i) => {
                        const expiry = getTimeRemaining(n.expires_at);
                        return (
                            <div className="notice-card-v2" key={n.id} style={{ animationDelay: `${i * 0.06}s` }}>
                                <div className="notice-card-header">
                                    <div className="notice-meta-left">
                                        <span className="notice-audience-badge">
                                            <Users size={11} /> {n.target_roles || 'Everyone'}
                                        </span>
                                        {expiry && !expiry.expired && (
                                            <span className="notice-expiry-badge">
                                                <Clock size={11} /> {expiry.text}
                                            </span>
                                        )}
                                    </div>
                                    <div className="notice-meta-right">
                                        <span className="notice-date">{formatDate(n.created_at)}</span>
                                        <Trash2 size={15} className="action-icon i-del" onClick={() => handleDelete(n.id)} />
                                    </div>
                                </div>
                                <h4 className="notice-title-text">{n.title}</h4>
                                <p className="notice-body-text">{n.message}</p>
                            </div>
                        );
                    })}

                    {/* Expired notices section */}
                    {expiredNotices.length > 0 && (
                        <>
                            <div className="expired-divider">
                                <AlertTriangle size={14} />
                                <span>Expired Notices ({expiredNotices.length})</span>
                            </div>
                            {expiredNotices.map(n => (
                                <div className="notice-card-v2 expired" key={n.id}>
                                    <div className="notice-card-header">
                                        <div className="notice-meta-left">
                                            <span className="notice-audience-badge">
                                                <Users size={11} /> {n.target_roles || 'Everyone'}
                                            </span>
                                            <span className="notice-expired-label">Expired</span>
                                        </div>
                                        <div className="notice-meta-right">
                                            <span className="notice-date">{formatDate(n.created_at)}</span>
                                            <Trash2 size={15} className="action-icon i-del" onClick={() => handleDelete(n.id)} />
                                        </div>
                                    </div>
                                    <h4 className="notice-title-text">{n.title}</h4>
                                    <p className="notice-body-text">{n.message}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Notices;
