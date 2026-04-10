import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Users as UsersIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';

const COLORS = ['#b89771', '#8f7354', '#059669', '#d97706', '#dc2626'];

export const Reports = () => {
  const { logs, items } = useAppContext();

  // Top 5 items by usage
  const topItems = useMemo(() => {
    const counts = {};
    logs.forEach(l => { counts[l.itemName] = (counts[l.itemName] || 0) + l.quantity; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [logs]);

  // Usage by category
  const categoryUsage = useMemo(() => {
    const cats = {};
    logs.forEach(l => { cats[l.itemCategory || 'Other'] = (cats[l.itemCategory || 'Other'] || 0) + l.quantity; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // Usage by staff
  const staffUsage = useMemo(() => {
    const staff = {};
    logs.forEach(l => { staff[l.staffName || 'Unknown'] = (staff[l.staffName || 'Unknown'] || 0) + l.quantity; });
    return Object.entries(staff).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [logs]);

  // Daily usage for last 7 days
  const dailyUsage = useMemo(() => {
    const days = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }
    logs.forEach(l => {
      const d = new Date(l.timestamp);
      const diff = Math.ceil(Math.abs(now - d) / (1000 * 60 * 60 * 24));
      if (diff <= 7) {
        const key = d.toLocaleDateString('en-US', { weekday: 'short' });
        if (days[key] !== undefined) days[key] += l.quantity;
      }
    });
    return Object.entries(days).map(([day, count]) => ({ day, count }));
  }, [logs]);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="app-header">
        <div>
          <h1>Reports</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Usage analytics, staff performance, and category breakdowns.</p>
        </div>
      </div>

      {/* Daily Usage Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} style={{ color: 'var(--accent-color)' }} /> Weekly Usage
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem', boxShadow: 'var(--shadow-elevated)' }} />
                <Bar dataKey="count" fill="#b89771" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: 'var(--accent-color)' }} /> Category Breakdown
          </h3>
          <div style={{ height: '220px' }}>
            {categoryUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryUsage} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryUsage.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No usage data yet.</div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {categoryUsage.map((entry, i) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Items and Staff tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent-color)' }} /> Most Issued Items
          </h3>
          {topItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No data yet.</p>
          ) : (
            topItems.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? 'var(--accent-gradient)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? 'white' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent-dark)', fontSize: '0.9rem' }}>{item.count}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon size={18} style={{ color: 'var(--accent-color)' }} /> Staff Activity
          </h3>
          {staffUsage.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>No data yet.</p>
          ) : (
            staffUsage.map((staff, i) => (
              <div key={staff.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>{staff.name.charAt(0)}</div>
                  <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{staff.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent-dark)', fontSize: '0.9rem' }}>{staff.count} items</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
