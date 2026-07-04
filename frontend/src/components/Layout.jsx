import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconBoxSeam,
  IconUsers,
  IconBuildingFactory2,
  IconLogout,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, end: true },
    { to: '/jobs', label: 'Jobs & Quotes', icon: IconBriefcase },
    { to: '/items', label: 'Item Catalog', icon: IconBoxSeam },
  ];

  if (user?.role === 'admin' || user?.role === 'manager') {
    navItems.push({ to: '/company-profile', label: 'Company Profile', icon: IconBuildingFactory2 });
  }
  if (user?.role === 'admin') {
    navItems.push({ to: '/users', label: 'Users', icon: IconUsers });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
        </button>
        <div className="brand">
          <img src="/safebox-icon.png" alt="" className="brand-icon" />
          <span>Safebox Quotation System</span>
        </div>
        <div className="topbar-user">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle dark mode" aria-label="Toggle dark mode">
            {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
          <button className="icon-btn" onClick={handleLogout} title="Log out" aria-label="Log out">
            <IconLogout size={20} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <nav>
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
