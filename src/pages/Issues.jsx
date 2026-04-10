import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const Issues = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const showToast = useToast();

    useEffect(() => { loadIssues(); }, []);

    const loadIssues = async () => {
        try { setIssues(await api.getIssues()); }
        catch { showToast('⚠️ Could not load issues'); }
        finally { setLoading(false); }
    };

    const handleResolve = async (id) => {
        try {
            await api.resolveIssue(id);
            showToast('✅ Issue marked as resolved');
            loadIssues();
        } catch { showToast('⚠️ Could not resolve issue'); }
    };

    return (
        <>
            <div className="section-header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>Campus Resolution Wall</h2>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading issues…</p></div>
            ) : issues.length === 0 ? (
                <div className="empty-state">
                    <CheckCircle size={36} style={{ opacity: .2 }} />
                    <p>No open issues. Campus is running smoothly!</p>
                </div>
            ) : (
                <div className="issue-grid">
                    {issues.map(issue => (
                        <div className="issue-card" key={issue.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <span className={`issue-status-badge ${issue.status === 'Resolved' ? 'status-resolved' : 'status-open'}`}>
                                    {issue.status}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--secondary-text)' }}>
                                    Reported by {issue.reporter_name}
                                </span>
                            </div>
                            <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>{issue.title}</h4>
                            {issue.status !== 'Resolved' && (
                                <button className="btn-primary" onClick={() => handleResolve(issue.id)}
                                    style={{ width: '100%', justifyContent: 'center', padding: '9px 20px', fontSize: 12 }}>
                                    <CheckCircle size={14} /> Mark Resolved
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default Issues;
