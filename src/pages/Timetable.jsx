import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Plus, Clock, MapPin, X } from 'lucide-react';

const Timetable = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const showToast = useToast();

    useEffect(() => { loadSlots(); }, []);

    const loadSlots = async () => {
        try { setSlots(await api.getSchedules()); }
        catch { showToast('⚠️ Could not load schedule'); }
        finally { setLoading(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        try {
            await api.createSchedule(Object.fromEntries(fd));
            showToast('✅ Slot allocated');
            setShowAdd(false);
            e.target.reset();
            loadSlots();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    return (
        <>
            <div className="section-header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>Academic Scheduling</h2>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Allocate Slot</button>
            </div>

            {loading ? (
                <div className="empty-state"><p>Loading schedule…</p></div>
            ) : slots.length === 0 ? (
                <div className="empty-state"><Clock size={36} style={{ opacity: .2 }} /><p>No schedule slots allocated yet.</p></div>
            ) : (
                <div className="schedule-grid">
                    {slots.map(s => (
                        <div className="schedule-card" key={s.id}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--accent)', marginBottom: 8 }}>
                                {s.day} | {s.time_slot}
                            </div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.subject_name}</h4>
                            <div style={{ fontSize: 12, color: 'var(--secondary-text)', display:'flex', gap: 12 }}>
                                <span style={{ display:'flex', alignItems:'center', gap: 4 }}><MapPin size={12} />{s.room}</span>
                                <span>{s.batch}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Allocate Schedule Slot</h2>
                            <X size={20} style={{ cursor:'pointer', color:'#94A3B8' }} onClick={() => setShowAdd(false)} />
                        </div>
                        <form className="form-grid" onSubmit={handleAdd}>
                            <input name="subject_name" className="form-input" placeholder="Subject Name" required />
                            <div className="form-row">
                                <select name="day" className="form-input" required>
                                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                <input name="time_slot" className="form-input" placeholder="Time (e.g. 9:00-10:00)" required />
                            </div>
                            <div className="form-row">
                                <input name="room" className="form-input" placeholder="Room Number" required />
                                <input name="batch" className="form-input" placeholder="Batch / Section" required />
                            </div>
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ width:'100%', justifyContent:'center' }}>
                                {submitting ? 'Allocating…' : 'Confirm Slot'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Timetable;
