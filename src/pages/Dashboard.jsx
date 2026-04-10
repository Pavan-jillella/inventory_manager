import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingDown, AlertTriangle, Activity, Clock, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { SHIFTS } from '../data/mockData';

const COLORS = ['#b89771', '#8f7354', '#059669', '#d97706', '#dc2626'];

export const Dashboard = () => {
  const { items, logs, getShiftStats } = useAppContext();

  const totalStock = items.reduce((acc, item) => acc + item.stock, 0);
  const lowStockCount = items.filter(i => i.stock <= i.minStock).length;

  const categoryData = useMemo(() => {
    const cats = {};
    items.forEach(item => { cats[item.category] = (cats[item.category] || 0) + item.stock; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [items]);

  const usageData = useMemo(() => {
    const days = {};
    [...logs].reverse().forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[date] = (days[date] || 0) + log.quantity;
    });
    return Object.entries(days).slice(-7).map(([date, amount]) => ({ date, amount }));
  }, [logs]);

  const topItems = useMemo(() => {
    const counts = {};
    logs.forEach(l => { counts[l.itemName] = (counts[l.itemName] || 0) + l.quantity; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [logs]);

  const todayShiftStats = SHIFTS.map(s => ({ ...s, ...getShiftStats(s.id) }));

  const cardAnim = (delay) => ({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { delay } });

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="app-header">
        <div>
          <h1>Control Center</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Overview of inventory health, usage, and shift performance.</p>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '2rem' }}>
        <motion.div {...cardAnim(0)} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stock</span>
            <div style={{ background: 'var(--accent-bg)', padding: '0.4rem', borderRadius: '0.5rem' }}><Package size={16} style={{ color: 'var(--accent-color)' }} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{totalStock}</div>
        </motion.div>

        <motion.div {...cardAnim(0.1)} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</span>
            <div style={{ background: '#fffbeb', padding: '0.4rem', borderRadius: '0.5rem' }}><AlertTriangle size={16} style={{ color: 'var(--warning-color)' }} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: lowStockCount > 0 ? 'var(--warning-color)' : 'inherit' }}>{lowStockCount}</div>
        </motion.div>

        <motion.div {...cardAnim(0.2)} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Issues</span>
            <div style={{ background: '#ecfdf5', padding: '0.4rem', borderRadius: '0.5rem' }}><Activity size={16} style={{ color: 'var(--success-color)' }} /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{logs.length}</div>
        </motion.div>

        <motion.div {...cardAnim(0.3)} className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Issued</span>
            <div style={{ background: '#fef2f2', padding: '0.4rem', borderRadius: '0.5rem' }}><TrendingDown size={16} style={{ color: 'var(--danger-color)' }} /></div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '0.5rem' }}>{topItems[0]?.[0] || 'N/A'}</div>
        </motion.div>
      </div>

      {/* ── Shift Stats ── */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '2rem' }}>
        {todayShiftStats.map((s, i) => (
          <motion.div key={s.id} {...cardAnim(0.1 * i)} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--shadow-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Clock size={16} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.label} Shift</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.start}:00–{s.end}:00</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.totalEntries}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Issues</div></div>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.totalItems}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Items</div></div>
              <div><div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.uniqueRooms}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rooms</div></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Usage Trend</h3>
          <div style={{ height: '280px' }}>
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem', boxShadow: 'var(--shadow-elevated)' }} />
                  <Line type="monotone" dataKey="amount" stroke="#b89771" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No data yet.</div>
            )}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Stock by Category</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                  {categoryData.map((_, index) => (<Cell key={index} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {categoryData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
