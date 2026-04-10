import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Shield, User, Key, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Staff = () => {
  const { users, addStaff, removeStaff } = useAppContext();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState('Front Desk');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) return;
    const success = addStaff(newName.trim(), newPin, newRole);
    if (success) {
      setNewName('');
      setNewPin('');
      setNewRole('Front Desk');
      setShowAdd(false);
    }
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      removeStaff(userId);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Staff</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage team members, PINs, and access levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>New Staff Member</h2>
                <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>

              <div className="input-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sarah Night" style={{ width: '100%', paddingLeft: '2.5rem' }} autoFocus />
                </div>
              </div>

              <div className="input-group">
                <label>4-Digit PIN</label>
                <div style={{ position: 'relative' }}>
                  <Key size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    value={newPin}
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setNewPin(v); }}
                    placeholder="e.g. 4567"
                    maxLength={4}
                    style={{ width: '100%', paddingLeft: '2.5rem', fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.3em' }}
                  />
                </div>
                {newPin.length > 0 && newPin.length < 4 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--warning-color)' }}>PIN must be 4 digits</span>
                )}
              </div>

              <div className="input-group">
                <label>Role</label>
                <select className="select" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%' }}>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAdd}
                  style={{ flex: 1, opacity: newName.trim() && newPin.length === 4 ? 1 : 0.5 }}
                  disabled={!newName.trim() || newPin.length !== 4}
                >
                  <Plus size={16} /> Create Staff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.75rem' }} placeholder="Search staff..." />
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>PIN</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No staff members found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: user.role === 'Admin' ? 'var(--accent-gradient)' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: user.role === 'Admin' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 700, fontSize: '0.8rem',
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>
                      {user.pin?.replace(/./g, '•')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {user.role === 'Admin' && <Shield size={13} style={{ color: 'var(--accent-color)' }} />}
                      <span style={{ fontWeight: user.role === 'Admin' ? 600 : 400, color: user.role === 'Admin' ? 'var(--accent-dark)' : 'var(--text-secondary)' }}>{user.role}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.4rem', color: 'var(--danger-color)' }}
                      onClick={() => handleDelete(user.id)}
                      title="Remove Staff"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
