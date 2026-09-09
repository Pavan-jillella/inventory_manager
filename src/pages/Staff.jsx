import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Shield, User, Lock, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isFirebaseConfigured } from '../lib/firebase';

export const Staff = () => {
  const { users, addStaff, removeStaff, currentUser, renameStaff } = useAppContext();
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Front Desk');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase()) ||
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (saving) return;
    if (!newName.trim() || !newUsername.trim() || !newPassword) { setError('Complete all fields.'); return; }
    if (isFirebaseConfigured && ((!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(newUsername) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUsername)) || newPassword.length < 12)) { setError('Use a username of 3–32 letters, numbers, dots, underscores or hyphens (or an email), and a password of at least 12 characters.'); return; }
    setError(''); setSaving(true);
    let success;
    try { success = await addStaff(newName.trim(), newUsername.trim(), newPassword, newRole); }
    finally { setSaving(false); }
    if (success) {
      setNewName('');
      setNewUsername('');
      setNewPassword('');
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
    <div className="suite-page staff-page">
      <div className="app-header">
        <div>
          <h1>Staff</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage team members, credentials, and access levels.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {editing && <section className="suite-panel"><h2>Edit staff account</h2><form className="ops-form" onSubmit={async e => { e.preventDefault(); if (saving) return; setSaving(true); setError(''); try { await renameStaff(editing.id, editing.name, editing.password); setEditing(null); } catch (e) { setError(e.message || 'Unable to save staff profile.'); } finally { setSaving(false); } }}><label className="ops-field"><span>Staff display name</span><input required maxLength={100} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label><label className="ops-field"><span>New password (optional)</span><input type="password" autoComplete="new-password" minLength={12} value={editing.password || ''} onChange={e => setEditing({ ...editing, password: e.target.value })} placeholder="Leave blank to keep the current password" /></label><div className="suite-toolbar"><button className="btn btn-primary" disabled={saving}>Save staff changes</button><button className="btn btn-outline" type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel edit</button></div>{error && <p role="alert" className="ops-error">{error}</p>}</form></section>}
      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAdd && (
          <Motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '440px', maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>New Staff Member</h2>
                <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>

              <div className="input-group">
                <label htmlFor="staff-name">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" id="staff-name" maxLength={100} value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Sarah Night" style={{ width: '100%', paddingLeft: '2.5rem' }} autoFocus />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="staff-email">Username or email</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" id="staff-email" autoComplete="off" value={newUsername} onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="e.g. frontdesk1" style={{ width: '100%', paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" aria-label="New staff password" autoComplete="new-password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 12 characters" style={{ width: '100%', paddingLeft: '2.5rem' }} />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="staff-role">Role</label>
                <select className="select" id="staff-role" value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%' }}>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {error && <p role="alert" className="ops-error">{error}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAdd}
                  style={{ flex: 1, opacity: newName.trim() && newUsername.trim() && newPassword.trim() ? 1 : 0.5 }}
                  disabled={saving || !newName.trim() || !newUsername.trim() || !newPassword}
                >
                  <Plus size={16} /> {saving ? 'Creating…' : 'Create Staff'}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
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
              <th>Username</th>
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
                <Motion.tr
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
                  <td style={{ color: 'var(--text-muted)' }}>@{user.username}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {user.role === 'Admin' && <Shield size={13} style={{ color: 'var(--accent-color)' }} />}
                      <span style={{ fontWeight: user.role === 'Admin' ? 600 : 400, color: user.role === 'Admin' ? 'var(--accent-dark)' : 'var(--text-secondary)' }}>{user.role}</span>
                    </div>
                  </td>
                  <td><span className="badge">{user.id === currentUser.id ? 'Signed in' : 'Staff profile'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" disabled={saving} onClick={() => { setError(''); setEditing({ id: user.id, name: user.name }); }}>Edit account</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0.4rem', color: 'var(--danger-color)' }}
                      onClick={() => handleDelete(user.id)}
                      title="Remove Staff"
                      aria-label={`Remove ${user.name}`}
                      disabled={saving || user.id === currentUser.id}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </Motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
