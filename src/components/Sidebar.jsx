import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Users, BookOpen, Calendar,
    Bell, Map, AlertTriangle, ShieldCheck, LogOut
} from 'lucide-react';

const navItems = [
    { path: '/admin-dashboard', label: 'Overview',           Icon: LayoutDashboard },
    { path: '/users',           label: 'Users Registry',     Icon: Users },
    { path: '/subjects',        label: 'Academic Portfolio', Icon: BookOpen },
    { path: '/timetable',       label: 'Class Schedule',     Icon: Calendar },
    { path: '/notices',         label: 'Campus Notices',     Icon: Bell },
    { path: '/blueprint',       label: 'Blueprint Hub',      Icon: Map },
    { path: '/issues',          label: 'Resolution Hub',     Icon: AlertTriangle },
];

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth');
    };

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <ShieldCheck size={28} />
                <span>Smart Campus</span>
            </div>

            <ul className="nav-list">
                {navItems.map(({ path, label, Icon }) => (
                    <li key={path} className="nav-item">
                        <NavLink
                            to={path}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <button className="sidebar-logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
