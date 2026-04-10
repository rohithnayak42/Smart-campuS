import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Plus, GraduationCap, Edit3, Trash2, X } from 'lucide-react';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editSubj, setEditSubj] = useState(null);
    const showToast = useToast();

    useEffect(() => { loadSubjects(); }, []);

    const loadSubjects = async () => {
        try { setSubjects(await api.getSubjects()); }
        catch { showToast('⚠️ Could not load subjects'); }
        finally { setLoading(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        try {
            await api.createSubject(Object.fromEntries(fd));
            showToast('✅ Subject registered');
            e.target.reset();
            setShowForm(false);
            loadSubjects();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this subject?')) return;
        try { await api.deleteSubject(id); showToast('✅ Subject removed'); loadSubjects(); }
        catch { showToast('⚠️ Delete failed'); }
    };

    const openEdit = (subj) => {
        if (!window.confirm('Edit this subject?')) return;
        setEditSubj(subj);
        setShowEdit(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        try {
            await api.updateSubject(editSubj.id, Object.fromEntries(fd));
            showToast('✅ Subject updated');
            setShowEdit(false);
            loadSubjects();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    const totalCredits = subjects.reduce((a, s) => a + (parseInt(s.credits) || 0), 0);

    return (
        <>
            <div className="page-hero">
                <div>
                    <h2>Course Portfolio</h2>
                    <p>Manage academic units, credit allocations, and faculty overseers.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} /> {showForm ? 'Close Form' : 'Add New Subject'}
                </button>
            </div>

            {showForm && (
                <div className="inline-form-card">
                    <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Register Academic Component</h3>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <input name="name" className="form-input" placeholder="Subject Name" required />
                        <input name="code" className="form-input" placeholder="Subject Code (e.g. CS101)" required />
                        <input name="credits" type="number" className="form-input" placeholder="Unit Credits" required />
                        <input name="faculty" className="form-input" placeholder="Designated Faculty" required />
                        <button type="submit" className="btn-primary" disabled={submitting}
                            style={{ gridColumn: '1 / -1', justifyContent: 'center' }}>
                            {submitting ? 'Registering…' : 'Authorize Component'}
                        </button>
                    </form>
                </div>
            )}

            <div className="premium-table-wrap">
                <table className="linear-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: 28 }}>Subject Name</th>
                            <th>Code</th>
                            <th>Credits</th>
                            <th>Faculty</th>
                            <th style={{ textAlign: 'right', paddingRight: 28 }}>Operations</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="empty-state">Loading portfolio…</td></tr>
                        ) : subjects.length === 0 ? (
                            <tr><td colSpan="5" className="empty-state">No subjects registered yet.</td></tr>
                        ) : subjects.map(s => (
                            <tr key={s.id}>
                                <td style={{ paddingLeft: 28 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="icon-circle color-purple" style={{ width: 32, height: 32, marginBottom: 0, flexShrink: 0 }}>
                                            <GraduationCap size={15} />
                                        </div>
                                        <span style={{ fontWeight: 700 }}>{s.name}</span>
                                    </div>
                                </td>
                                <td><span className="badge-code">{s.code}</span></td>
                                <td><span className="badge-credits">{s.credits} Credits</span></td>
                                <td><span className="badge-area">{s.faculty}</span></td>
                                <td style={{ paddingRight: 28 }}>
                                    <div className="actions-cell">
                                        <Edit3 size={17} className="action-icon i-edit" onClick={() => openEdit(s)} />
                                        <Trash2 size={17} className="action-icon i-del" onClick={() => handleDelete(s.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="table-footer">Total Academic Credits: {totalCredits}</div>
            </div>

            {/* Edit Modal */}
            {showEdit && editSubj && (
                <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Edit Subject</h2>
                            <X size={20} style={{ cursor:'pointer', color:'#94A3B8' }} onClick={() => setShowEdit(false)} />
                        </div>
                        <form className="form-grid" onSubmit={handleUpdate}>
                            <input name="name" className="form-input" defaultValue={editSubj.name} required />
                            <input name="code" className="form-input" defaultValue={editSubj.code} required />
                            <input name="credits" type="number" className="form-input" defaultValue={editSubj.credits} required />
                            <input name="faculty" className="form-input" defaultValue={editSubj.faculty} required />
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ width:'100%', justifyContent:'center' }}>
                                {submitting ? 'Saving…' : '✅ Update Subject'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Subjects;
