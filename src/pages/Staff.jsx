import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Shield, User, Clock } from 'lucide-react';
import { MOCK_USERS } from '../data/mockData';

export const Staff = () => {
  const [users] = useState(() => {
    const saved = localStorage.getItem('inventory_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.role.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Staff</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage team members, roles, and access permissions.</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add Staff</button>
      </div>

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
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
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
                  <td><span className="badge badge-success">Active</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                    </div>
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
