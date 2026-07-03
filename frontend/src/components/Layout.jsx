import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconBriefcase,
  IconBoxSeam,
  IconUsers,
  IconLogout,
  IconMenu2,
  IconX,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
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

  if (user?.role === 'admin') {
    navItems.push({ to: '/users', label: 'Users', icon: IconUsers });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn mobile-only" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
        </button>
        <span className="brand">Safebox Quotation System</span>
        <div className="topbar-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
          <button className="icon-btn" onClick={handleLogout} title="Log out">
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
