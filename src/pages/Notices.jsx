import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Bell, Plus, X } from 'lucide-react';

const Notices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const showToast = useToast();

    useEffect(() => { loadNotices(); }, []);

    const loadNotices = async () => {
        try { setNotices(await api.getNotices()); }
        catch { showToast('⚠️ Could not load notices'); }
        finally { setLoading(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        try {
            await api.createNotice(Object.fromEntries(fd));
            showToast('✅ Notice published');
            setShowAdd(false);
            e.target.reset();
            loadNotices();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    return (
        <>
            <div className="section-header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>Live Broadcasts</h2>
                <button className="btn-secondary" onClick={() => setShowAdd(true)}><Plus size={16} /> Transmit Notice</button>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading notices…</p></div>
            ) : notices.length === 0 ? (
                <div className="empty-state"><Bell size={36} style={{ opacity: .2 }} /><p>No notices published yet.</p></div>
            ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                    {notices.map(n => (
                        <div className="notice-card" key={n.id}>
                            <h4>{n.title}</h4>
                            <p>{n.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Publish Notice</h2>
                            <X size={20} style={{ cursor:'pointer', color:'#94A3B8' }} onClick={() => setShowAdd(false)} />
                        </div>
                        <form className="form-grid" onSubmit={handleAdd}>
                            <input name="title" className="form-input" placeholder="Notice Title" required />
                            <textarea name="message" className="form-input" placeholder="Notice Content…" rows="5" required style={{ resize: 'vertical' }} />
                            <button type="submit" className="btn-secondary" disabled={submitting} style={{ width:'100%', justifyContent:'center' }}>
                                {submitting ? 'Publishing…' : 'Broadcast Notice'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Notices;
