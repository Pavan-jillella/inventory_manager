import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Package, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Alerts = () => {
  const { items } = useAppContext();
  const lowStock = items.filter(i => i.stock > 0 && i.stock <= i.minStock);
  const outOfStock = items.filter(i => i.stock === 0);
  const healthy = items.length - lowStock.length - outOfStock.length;

  const allAlerts = [
    ...outOfStock.map(i => ({ ...i, severity: 'critical', message: 'Out of stock' })),
    ...lowStock.map(i => ({ ...i, severity: 'warning', message: `${i.stock} left (min: ${i.minStock})` })),
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Alerts</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Stock warnings and notifications.</p>
        </div>
      </div>

      {/* Summary Row — compact */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Out of Stock', count: outOfStock.length, icon: <ShieldAlert size={15} />, color: 'var(--danger-color)', bg: '#fef2f2' },
          { label: 'Low Stock', count: lowStock.length, icon: <AlertTriangle size={15} />, color: 'var(--warning-color)', bg: '#fffbeb' },
          { label: 'Healthy', count: healthy, icon: <Package size={15} />, color: 'var(--success-color)', bg: '#ecfdf5' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '0.85rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ padding: '0.4rem', borderRadius: '0.45rem', background: s.bg, display: 'flex', color: s.color }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: s.count > 0 && s.label !== 'Healthy' ? s.color : s.color }}>{s.count}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts Grid — medium small cards */}
      {allAlerts.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Package size={24} style={{ color: 'var(--success-color)' }} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--success-color)', fontWeight: 500, margin: 0 }}>All Clear</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No stock alerts at this time.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.65rem', overflowY: 'auto', flex: 1, alignContent: 'start' }}>
          {allAlerts.map((alert, index) => (
            <motion.div
              key={`${alert.id}-${alert.severity}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.75rem',
                background: alert.severity === 'critical' ? 'rgba(254,242,242,0.8)' : 'rgba(255,251,235,0.8)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: `1px solid ${alert.severity === 'critical' ? '#fecaca' : '#fde68a'}`,
              }}
            >
              {alert.image ? (
                <img src={alert.image} alt={alert.name} style={{ width: '32px', height: '32px', borderRadius: '0.35rem', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.05)' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '0.35rem', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} /></div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.name}</div>
                <div style={{ fontSize: '0.65rem', color: alert.severity === 'critical' ? 'var(--danger-color)' : 'var(--warning-color)' }}>{alert.message}</div>
              </div>
              <span className={`badge ${alert.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.55rem' }}>
                {alert.severity === 'critical' ? 'Out' : 'Low'}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
