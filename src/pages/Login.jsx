import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Lock, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const user = login(username, password);
    if (user) {
      if (user.role === 'Admin') navigate('/admin');
      else navigate('/issue-item');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem',
      background: 'linear-gradient(135deg, #faf9f6 0%, #f0ebe4 50%, #e8e0d5 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: '100%', maxWidth: '420px', padding: '3rem',
          background: 'white', borderRadius: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--accent-gradient)', marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-warm)',
          }}>
            <Package size={30} color="white" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>OmniTrack</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Hotel Inventory Suite</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ padding: '0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #fecaca' }}
            >
              {error}
            </motion.div>
          )}

          <div className="input-group">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.75rem' }}
                placeholder="Enter your username"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.75rem' }}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Demo Credentials</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setUsername('admin'); setPassword('password'); }}>
              Admin
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setUsername('desk'); setPassword('password'); }}>
              Front Desk
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
