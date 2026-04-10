import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { Search, UserPlus, Edit3, Trash2, Key, X } from 'lucide-react';

const UsersRegistry = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modals
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const showToast = useToast();
    const location = useLocation();

    // Session Check & Auto-open modal
    useEffect(() => {
        if (!localStorage.getItem('sc_token')) {
            window.location.href = '/auth.html';
            return;
        }
        const p = new URLSearchParams(location.search);
        if (p.get('openModal')) setShowAdd(true);
    }, [location.search]);

    useEffect(() => { 
        if (localStorage.getItem('sc_token')) {
            loadUsers(); 
        }
    }, []);

    useEffect(() => {
        let r = users;
        if (roleFilter !== 'All') r = r.filter(u => u.role === roleFilter);
        if (search) {
            const s = search.toLowerCase();
            r = r.filter(u => u.name?.toLowerCase().includes(s) || u.login_email?.toLowerCase().includes(s));
        }
        setFiltered(r);
    }, [users, search, roleFilter]);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch { showToast('⚠️ Could not load users'); }
        finally { setLoading(false); }
    };

    const handleAddUser = async (formData) => {
        try {
            const data = Object.fromEntries(formData);
            
            // Password confirmation check
            if (data.password !== data.confirmPassword) {
                showToast('⚠️ Passwords do not match');
                return;
            }

            const res = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('sc_token')}`
                },
                body: JSON.stringify({
                    name: data.name,
                    campusEmail: data.loginEmail,
                    personalEmail: data.realEmail,
                    role: data.role,
                    password: data.password
                })
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.message || result.error);

            showToast('✅ User onboarded successfully');
            setShowAdd(false);
            loadUsers();
        } catch (err) {
            console.error(err);
            showToast(`⚠️ Failed to create user: ${err.message}`);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Fix: Robust Admin role check (prevents Access Denied issue)
        const storedRole = localStorage.getItem("sc_role") || localStorage.getItem("role");
        if (storedRole?.toLowerCase() !== "admin") {
            return showToast("⚠️ Access denied. Requires Admin role.");
        }

        // Fix: Double-click issue
        if (submitting) return;
        setSubmitting(true);

        const formData = new FormData(e.target);
        await handleAddUser(formData);

        setSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.deleteUser(id);
            showToast('✅ User removed');
            loadUsers();
        } catch { showToast('⚠️ Delete failed'); }
    };

    const openEdit = (user) => {
        if (!window.confirm('Do you want to edit this user?')) return;
        setEditUser(user);
        setShowEdit(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        try {
            await api.updateUser(editUser.id, data);
            showToast('✅ User updated');
            setShowEdit(false);
            loadUsers();
        } catch (err) { showToast(`⚠️ ${err.message}`); }
        finally { setSubmitting(false); }
    };

    const roles = ['All', 'Student', 'Faculty', 'Staff', 'Security Guard', 'Worker', 'Admin'];
    const roleBadge = (role) => {
        const cls = {
            'Student': 'bg-student', 'Faculty': 'bg-faculty', 'Staff': 'bg-faculty',
            'Security Guard': 'bg-security', 'Worker': 'bg-worker', 'Admin': 'bg-admin'
        };
        return cls[role] || 'bg-student';
    };

    return (
        <>
            {/* Hero */}
            <div className="page-hero">
                <div>
                    <h2>Manage Campus Users</h2>
                    <p>Onboard, verify, and manage all stakeholders from a unified hub.</p>
                </div>
                <div className="hero-actions">
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position:'absolute', left:12, top:12, color:'#94A3B8' }} />
                        <input className="glass-search" style={{ paddingLeft: 36 }}
                            placeholder="Search Name/Email…" value={search}
                            onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                        <UserPlus size={16} /> Onboard User
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-system">
                {roles.map(r => (
                    <button key={r} className={`filter-pill${roleFilter === r ? ' active' : ''}`}
                        onClick={() => setRoleFilter(r)}>
                        {r === 'Security Guard' ? 'Guards' : r === 'All' ? 'All Stakeholders' : r + 's'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="premium-table-wrap">
                <table className="linear-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: 28 }}>Name &amp; Email</th>
                            <th>Role</th>
                            <th>Campus Email</th>
                            <th>Onboarding Date</th>
                            <th style={{ textAlign: 'right', paddingRight: 28 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="empty-state">Loading identities…</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" className="empty-state">No stakeholders found.</td></tr>
                        ) : filtered.map(u => (
                            <tr key={u.id}>
                                <td style={{ paddingLeft: 28 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--secondary-text)' }}>{u.real_email}</div>
                                </td>
                                <td><span className={`badge-role ${roleBadge(u.role)}`}>{u.role}</span></td>
                                <td style={{ fontSize: 13 }}>{u.login_email}</td>
                                <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td style={{ paddingRight: 28 }}>
                                    <div className="actions-cell">
                                        <Edit3 size={17} className="action-icon i-edit" onClick={() => openEdit(u)} />
                                        <Key size={17} className="action-icon i-reset" title="Reset Password" />
                                        <Trash2 size={17} className="action-icon i-del" onClick={() => handleDelete(u.id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Onboard New Stakeholder</h2>
                            <X size={20} style={{ cursor:'pointer', color:'#94A3B8' }} onClick={() => setShowAdd(false)} />
                        </div>
                        <form className="form-grid" onSubmit={handleCreate}>
                            <input name="name" className="form-input" placeholder="Full Name" required />
                            <input name="loginEmail" type="email" className="form-input" placeholder="Campus Email (login)" required />
                            <input name="realEmail" type="email" className="form-input" placeholder="Personal Email (credentials)" required />
                            <select name="role" className="form-input" required>
                                <option value="Student">Student</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Staff">Staff</option>
                                <option value="Worker">Worker</option>
                                <option value="Security Guard">Security Guard</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <input name="password" type="password" className="form-input" placeholder="Default Password" required />
                            <input name="confirmPassword" type="password" className="form-input" placeholder="Confirm Password" required />
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent:'center' }}>
                                {submitting ? 'Processing…' : 'Authorize & Notify Identity'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEdit && editUser && (
                <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>Edit Stakeholder</h2>
                            <X size={20} style={{ cursor:'pointer', color:'#94A3B8' }} onClick={() => setShowEdit(false)} />
                        </div>
                        <form className="form-grid" onSubmit={handleUpdate}>
                            <input name="name" className="form-input" defaultValue={editUser.name} required />
                            <input name="loginEmail" type="email" className="form-input" defaultValue={editUser.login_email} required />
                            <input name="realEmail" type="email" className="form-input" defaultValue={editUser.real_email} required />
                            <select name="role" className="form-input" defaultValue={editUser.role} required>
                                <option value="Student">Student</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Staff">Staff</option>
                                <option value="Worker">Worker</option>
                                <option value="Security Guard">Security Guard</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent:'center' }}>
                                {submitting ? 'Saving…' : '✅ Update User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UsersRegistry;
