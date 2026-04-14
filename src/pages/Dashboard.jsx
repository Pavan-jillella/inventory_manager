import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { SHIFTS, getCurrentShift } from '../data/mockData';

const COLORS = ['#b89771', '#8f7354', '#059669', '#d97706', '#dc2626'];

export const Dashboard = () => {
  const { items, logs, getShiftStats, getLogsForYear } = useAppContext();
  const currentYear = new Date().getFullYear();
  const ytdLogs = useMemo(() => getLogsForYear(currentYear), [logs, getLogsForYear, currentYear]);

  const totalStock = items.reduce((s, i) => s + i.stock, 0);
  const lowStockItems = items.filter(i => i.stock <= i.minStock);
  const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString());
  const totalIssues = todayLogs.length;
  const todayRevenue = todayLogs.reduce((s, l) => s + (l.totalAmount || 0), 0);

  const ytdRevenue = ytdLogs.reduce((s, l) => s + (l.totalAmount || 0), 0);
  const ytdCost = ytdLogs.reduce((s, l) => s + (l.purchaseCost || 0), 0);
  const ytdProfit = ytdRevenue - ytdCost;

  const mostIssued = useMemo(() => {
    const counts = {};
    todayLogs.forEach(l => { counts[l.itemName] = (counts[l.itemName] || 0) + l.quantity; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : 'None';
  }, [todayLogs]);

  // Shift stats with amounts
  const shiftData = SHIFTS.map(s => {
    const stats = getShiftStats(s.id);
    return { ...s, ...stats };
  });

  // Daily revenue for line chart (last 7 days)
  const dailyRevenue = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dayStr);
      const revenue = dayLogs.reduce((s, l) => s + (l.totalAmount || 0), 0);
      const cost = dayLogs.reduce((s, l) => s + (l.purchaseCost || 0), 0);
      days.push({
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue,
        cost,
        profit: revenue - cost,
      });
    }
    return days;
  }, [logs]);

  // Stock by category for pie
  const categoryStock = useMemo(() => {
    const cats = {};
    items.forEach(i => { cats[i.category] = (cats[i.category] || 0) + i.stock; });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [items]);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="app-header">
        <div>
          <h1>Control Center</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Overview of inventory health, usage, and shift performance.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Stock', value: totalStock, icon: <Package size={18} style={{ color: 'var(--accent-color)' }} />, color: 'var(--text-primary)' },
          { label: 'Low Stock', value: lowStockItems.length, icon: <AlertTriangle size={18} style={{ color: 'var(--warning-color)' }} />, color: lowStockItems.length > 0 ? 'var(--warning-color)' : 'var(--success-color)' },
          { label: 'Total Issues', value: totalIssues, icon: <TrendingUp size={18} style={{ color: 'var(--success-color)' }} />, color: 'var(--text-primary)' },
          { label: "Today's Sales", value: `$${todayRevenue.toFixed(2)}`, icon: <DollarSign size={18} style={{ color: 'var(--accent-color)' }} />, color: 'var(--accent-dark)' },
          { label: "YTD Revenue", value: `$${ytdRevenue.toFixed(0)}`, icon: <TrendingUp size={18} style={{ color: 'var(--success-color)' }} />, color: 'var(--success-color)' },
        ].map((stat, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</span>
              {stat.icon}
            </div>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, color: stat.color }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* YTD Snapshot Banner */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
        style={{ 
          marginBottom: '1.5rem', padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--accent-dark), hsla(35,30%,42%,1))',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: 'var(--shadow-warm)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year-to-Date Snapshot ({currentYear})</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>${ytdRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} Total Sales</div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>YTD Profit</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>${ytdProfit.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>YTD Items Sold</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{ytdLogs.reduce((s,l) => s + l.quantity, 0)}</div>
          </div>
        </div>
      </motion.div>

      {/* Shift Performance */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '1.5rem' }}>
        {shiftData.map((s, i) => (
          <motion.div key={s.id} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Clock size={14} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label} Shift</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.start}:00–{s.end}:00</span>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.totalEntries}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Issues</div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.totalItems}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Items</div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--accent-dark)' }}>${s.totalAmount.toFixed(0)}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Amount</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Revenue Trend (7 days)</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem', boxShadow: 'var(--shadow-elevated)' }} formatter={(v) => [`$${v.toFixed(2)}`]} />
                <Line type="monotone" dataKey="revenue" stroke="#b89771" strokeWidth={2.5} dot={{ fill: '#b89771', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} dot={{ fill: '#059669', r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Stock by Category</h3>
          <div style={{ height: '220px' }}>
            {categoryStock.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryStock} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryStock.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No data</div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            {categoryStock.map((e, i) => (
              <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                <span style={{ color: 'var(--text-secondary)' }}>{e.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
