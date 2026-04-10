import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Package, ClipboardList, LayoutDashboard, Settings, Users, AlertTriangle, BarChart3, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getCurrentShift } from '../data/mockData';

export const Layout = () => {
  const { currentUser, logout, items } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!currentUser) return <Outlet />;

  const isAdmin = currentUser.role === 'Admin';
  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;
  const shift = getCurrentShift();

  return (
    <div className="app-container">
      <nav className="sidebar">
        {/* Brand */}
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.2, color: 'var(--text-primary)' }}>Country Inn</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>& Suites</div>
          </div>
        </div>

        {/* Shift Badge */}
        <div style={{ padding: '0.6rem 1rem', margin: '0.75rem', borderRadius: '0.6rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={13} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-dark)' }}>{shift.label} Shift</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{shift.start}:00–{shift.end}:00</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '0.25rem' }}>
          <div style={{ padding: '0.5rem 1.25rem', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
            Front Desk
          </div>
          <NavLink to="/issue-item" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={18} /> Issue Item
          </NavLink>
          <NavLink to="/activity" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <ClipboardList size={18} /> Activity Log
          </NavLink>

          {isAdmin && (
            <>
              <div style={{ padding: '1rem 1.25rem 0.5rem', fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
                Administration
              </div>
              <NavLink to="/admin" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
              <NavLink to="/admin/products" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <Package size={18} /> Inventory
              </NavLink>
              <NavLink to="/admin/alerts" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <AlertTriangle size={18} /> Alerts
                {lowStockCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {lowStockCount}
                  </span>
                )}
              </NavLink>
              <NavLink to="/admin/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <BarChart3 size={18} /> Reports
              </NavLink>
              <NavLink to="/admin/staff" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={18} /> Staff
              </NavLink>
              <NavLink to="/admin/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                <Settings size={18} /> Settings
              </NavLink>
            </>
          )}
        </div>

        {/* User Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentUser.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
