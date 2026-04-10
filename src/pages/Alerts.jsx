import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, TrendingDown, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Alerts = () => {
  const { items } = useAppContext();

  const lowStock = items.filter(i => i.stock > 0 && i.stock <= i.minStock);
  const outOfStock = items.filter(i => i.stock === 0);
  const criticalItems = items.filter(i => i.stock > 0 && i.stock <= Math.floor(i.minStock / 2));

  const allAlerts = [
    ...outOfStock.map(i => ({ ...i, severity: 'critical', message: 'Out of stock — needs immediate restocking' })),
    ...criticalItems.map(i => ({ ...i, severity: 'critical', message: `Critical — only ${i.stock} left (min: ${i.minStock})` })),
    ...lowStock.filter(i => !criticalItems.includes(i)).map(i => ({ ...i, severity: 'warning', message: `Low stock — ${i.stock} remaining (min: ${i.minStock})` })),
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Alerts</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Stock warnings and critical inventory notifications.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#fef2f2', padding: '0.5rem', borderRadius: '0.5rem' }}><ShieldAlert size={18} style={{ color: 'var(--danger-color)' }} /></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out of Stock</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: outOfStock.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>{outOfStock.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#fffbeb', padding: '0.5rem', borderRadius: '0.5rem' }}><AlertTriangle size={18} style={{ color: 'var(--warning-color)' }} /></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: lowStock.length > 0 ? 'var(--warning-color)' : 'var(--success-color)' }}>{lowStock.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '0.5rem' }}><Package size={18} style={{ color: 'var(--success-color)' }} /></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Healthy Items</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--success-color)' }}>{items.length - lowStock.length - outOfStock.length}</div>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
        {allAlerts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '3rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Package size={28} style={{ color: 'var(--success-color)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--success-color)', fontWeight: 500 }}>All Clear</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No stock alerts at this time.</p>
          </div>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {allAlerts.map((alert, index) => (
              <motion.div
                key={`${alert.id}-${alert.severity}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', margin: '0.25rem',
                  borderRadius: '0.75rem',
                  background: alert.severity === 'critical' ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${alert.severity === 'critical' ? '#fecaca' : '#fde68a'}`,
                }}
              >
                <img src={alert.image} alt={alert.name} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.name}</div>
                  <div style={{ fontSize: '0.8rem', color: alert.severity === 'critical' ? 'var(--danger-color)' : 'var(--warning-color)', marginTop: '0.15rem' }}>
                    {alert.message}
                  </div>
                </div>
                <span className={`badge ${alert.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                  {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
