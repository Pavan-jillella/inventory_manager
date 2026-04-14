import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Package, Users as UsersIcon, FileDown, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';

const COLORS = ['#b89771', '#8f7354', '#059669', '#d97706', '#dc2626'];

export const Reports = () => {
  const { logs, items, settings } = useAppContext();
  const [period, setPeriod] = useState('7');

  const periodLogs = useMemo(() => {
    if (period === 'all') return logs;
    const now = new Date();
    return logs.filter(l => {
      const diffDays = Math.ceil(Math.abs(now - new Date(l.timestamp)) / (1000 * 60 * 60 * 24));
      return diffDays <= parseInt(period);
    });
  }, [logs, period]);

  const activeCategories = useMemo(() => new Set((settings.categories || []).map((c) => c.trim().toLowerCase())), [settings.categories]);

  const topItems = useMemo(() => {
    const counts = {};
    periodLogs.forEach(l => { counts[l.itemName] = (counts[l.itemName] || 0) + l.quantity; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
  }, [periodLogs]);

  const categoryUsage = useMemo(() => {
    const cats = {};
    periodLogs.forEach((l) => {
      const rawCategory = (l.itemCategory || '').trim();
      const normalized = rawCategory.toLowerCase();
      const label = rawCategory && activeCategories.has(normalized) ? rawCategory : 'Other';
      cats[label] = (cats[label] || 0) + l.quantity;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [periodLogs, activeCategories]);

  const staffUsage = useMemo(() => {
    const staff = {};
    periodLogs.forEach(l => { staff[l.staffName || 'Unknown'] = (staff[l.staffName || 'Unknown'] || 0) + l.quantity; });
    return Object.entries(staff).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [periodLogs]);

  const dailyUsage = useMemo(() => {
    const days = {};
    const now = new Date();
    const daysToLookBack = period === 'all' ? 30 : parseInt(period);
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayLabel = daysToLookBack <= 7 
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[dayLabel] = { label: dayLabel, count: 0 };
    }
    periodLogs.forEach(l => {
      const d = new Date(l.timestamp);
      const diff = Math.floor(Math.abs(now - d) / (1000 * 60 * 60 * 24));
      if (diff < daysToLookBack) {
        const dayLabel = daysToLookBack <= 7 
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (days[dayLabel]) days[dayLabel].count += l.quantity;
      }
    });
    return Object.values(days);
  }, [periodLogs, period]);

  const exportCurrentReport = () => {
    let csv = `Report Period:,${period === 'all' ? 'All Time' : 'Last ' + period + ' Days'}\n\n`;
    
    // Summary Headers
    csv += 'TOP ITEMS\nItem Name,Quantity Issued\n';
    topItems.forEach(i => csv += `"${i.name}",${i.count}\n`);
    csv += '\nSTAFF USAGE\nStaff Member,Quantity Issued\n';
    staffUsage.forEach(s => csv += `"${s.name}",${s.count}\n`);
    csv += '\nCATEGORY BREAKDOWN\nCategory,Quantity Issued\n';
    categoryUsage.forEach(c => csv += `"${c.name}",${c.value}\n`);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportFullInventory = () => {
    const headers = 'Item ID,Name,Category,Current Stock,Min Stock,Purchase Rate,Staff Rate,Guest Rate\n';
    const rows = items.map(i => `${i.id},"${i.name}","${i.category}",${i.stock},${i.minStock},${i.purchaseRate || 0},${i.staffRate || 0},${i.guestRate || 0}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_snapshot_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="app-header">
        <div>
          <h1>Reports & Export</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Usage analytics and data exporting.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            {[{ k: '7', l: '7D' }, { k: '30', l: '30D' }, { k: 'all', l: 'All' }].map(p => (
              <button key={p.k} onClick={() => setPeriod(p.k)} style={{
                padding: '0.3rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: 600,
                background: period === p.k ? 'white' : 'transparent', color: period === p.k ? 'var(--accent-dark)' : 'var(--text-muted)',
                boxShadow: period === p.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s',
              }}>{p.l}</button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={exportFullInventory} style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}><FileDown size={14} /> Full Inventory</button>
          <button className="btn btn-outline btn-sm" onClick={exportCurrentReport} style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}><Download size={14} /> Report Data</button>
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
                <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} />
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
