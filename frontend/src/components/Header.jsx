import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Search,
    Wand2,
    Zap,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/applications', icon: FileText, label: 'Applications' },
    { to: '/discover', icon: Search, label: 'Discover' },
    { to: '/tailor', icon: Wand2, label: 'Tailor Resume' },
];

export default function Header() {
    return (
        <header className="header">
            <div className="header-container">
                <div className="header-logo">
                    <div className="header-logo-icon">
                        <Zap size={20} />
                    </div>
                    <h1>HireFlow</h1>
                </div>

                <nav className="header-nav">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="header-actions">
                    <span className="version-badge">v0.1.0 — AI-Powered</span>
                </div>
            </div>
        </header>
    );
}
