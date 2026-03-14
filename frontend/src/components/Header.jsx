import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Zap, LayoutDashboard, Search, Briefcase, ClipboardList, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('hireflow-theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.body.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        if (isDark) {
            document.body.classList.remove('dark');
            localStorage.setItem('hireflow-theme', 'light');
            setIsDark(false);
        } else {
            document.body.classList.add('dark');
            localStorage.setItem('hireflow-theme', 'dark');
            setIsDark(true);
        }
    };

    const navLinks = [
        { path: '/', label: 'Overview' },
        { path: '/discover', label: 'Discover' },
        { path: '/jobs', label: 'Jobs' },
        { path: '/applications', label: 'Applications' },
        { path: '/tailor', label: 'Tailor Resume' }
    ];

    // Mobile bottom nav — 4 tabs + 1 primary (Tailor)
    const mobileNav = [
        { path: '/', label: 'Home', icon: <LayoutDashboard size={18} /> },
        { path: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
        { path: '/tailor', label: 'Tailor', icon: <Wand2 size={20} />, primary: true },
        { path: '/discover', label: 'Discover', icon: <Search size={18} /> },
        { path: '/applications', label: 'Apply', icon: <ClipboardList size={18} /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <header className="header">
                <div className="header-container">
                    {/* Logo Area */}
                    <Link to="/" className="header-logo">
                        <div className="header-logo-mark">
                            <Zap size={14} strokeWidth={3} />
                        </div>
                        <span>HireFlow</span>
                    </Link>

                    {/* Main Navigation (desktop only — hidden on mobile via CSS) */}
                    <nav className="header-nav">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={isActive(link.path) ? 'active' : ''}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Controls */}
                    <div className="header-actions">
                        <span className="version-string">v2.0.0</span>
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                            {isDark ? <Sun size={14} strokeWidth={2.5} /> : <Moon size={14} strokeWidth={2.5} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation (shown only on mobile via CSS) */}
            <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
                {mobileNav.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item${item.primary ? ' primary' : ''}${isActive(item.path) ? ' active' : ''}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
