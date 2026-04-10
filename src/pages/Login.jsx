import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
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
      background: 'url(/hotel-bg.jpg) center/cover no-repeat',
      position: 'relative',
    }}>
      {/* Dark overlay for better readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}></div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          width: '100%', maxWidth: '380px', padding: '2.5rem 2rem',
          background: 'rgba(255, 255, 255, 0.85)', borderRadius: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          textAlign: 'center',
          position: 'relative', zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '1.5rem' }}>
          <img
            src="/logo.png"
            alt="Country Inn & Suites"
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.15rem', letterSpacing: '-0.02em' }}>
            Country Inn & Suites
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Inventory System
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '0.6rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" style={{ width: '100%', paddingLeft: '2.5rem' }} autoFocus />
            </div>
          </div>
          <div className="input-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ width: '100%', paddingLeft: '2.5rem' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}>
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};
