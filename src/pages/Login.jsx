import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Delete } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Login = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { loginWithPin } = useAppContext();
  const navigate = useNavigate();

  const handleDigit = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // Auto-submit when 4 digits entered
    if (newPin.length === 4) {
      setTimeout(() => {
        const user = loginWithPin(newPin);
        if (user) {
          if (user.role === 'Admin') navigate('/admin');
          else navigate('/issue-item');
        } else {
          setError('Invalid PIN');
          setPin('');
        }
      }, 200);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const dots = [0, 1, 2, 3];

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
          width: '100%', maxWidth: '360px', padding: '2.5rem 2rem',
          background: 'white', borderRadius: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
          textAlign: 'center',
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

        {/* PIN Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {dots.map(i => (
            <motion.div
              key={i}
              animate={{ scale: pin.length > i ? 1.2 : 1, background: pin.length > i ? 'var(--accent-gradient)' : '#e5e7eb' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: pin.length > i ? 'hsl(35, 30%, 48%)' : '#e5e7eb',
                transition: 'background 0.15s ease',
              }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: 500 }}
          >
            {error}
          </motion.div>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Enter your 4-digit PIN
        </p>

        {/* Number Pad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', maxWidth: '260px', margin: '0 auto' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(String(num))}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: '50%',
                fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)',
                color: 'var(--text-primary)', cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f9fafb'; }}
            >
              {num}
            </button>
          ))}
          <div /> {/* empty cell */}
          <button
            onClick={() => handleDigit('0')}
            style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-display)',
              background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)',
              color: 'var(--text-primary)', cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.background = 'var(--accent-bg)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#f9fafb'; }}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              fontSize: '1rem', background: 'transparent', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={e => e.currentTarget.style.color = 'var(--danger-color)'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Delete size={22} />
          </button>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Admin: 1234 · Staff: 0000
        </div>
      </motion.div>
    </div>
  );
};
