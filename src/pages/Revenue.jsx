import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, CreditCard, Banknote, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useAppContext } from '../context/AppContext';

const COLORS = ['#059669', '#3b82f6', '#b89771', '#d97706', '#8b5cf6'];

export const Revenue = () => {
  const { logs, items } = useAppContext();
  const [period, setPeriod] = useState('7');

  const periodLogs = useMemo(() => {
    const now = new Date();
    return logs.filter(l => {
      const diff = Math.ceil(Math.abs(now - new Date(l.timestamp)) / (1000 * 60 * 60 * 24));
      return diff <= parseInt(period);
    });
  }, [logs, period]);

  const totalRevenue = periodLogs.reduce((s, l) => s + (l.totalAmount || 0), 0);
  const totalCost = periodLogs.reduce((s, l) => s + (l.purchaseCost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const cashRevenue = periodLogs.filter(l => l.paymentMethod === 'cash').reduce((s, l) => s + (l.totalAmount || 0), 0);
  const cardRevenue = periodLogs.filter(l => l.paymentMethod === 'card').reduce((s, l) => s + (l.totalAmount || 0), 0);

  // Daily revenue
  const dailyData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dayStr);
      days.push({
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayLogs.reduce((s, l) => s + (l.totalAmount || 0), 0),
        cost: dayLogs.reduce((s, l) => s + (l.purchaseCost || 0), 0),
        profit: dayLogs.reduce((s, l) => s + (l.totalAmount || 0) - (l.purchaseCost || 0), 0),
      });
    }
    return days;
  }, [logs, period]);

  // Payment split
  const paymentSplit = [
    { name: 'Cash', value: cashRevenue },
    { name: 'Card', value: cardRevenue },
  ].filter(p => p.value > 0);

  // Top revenue items
  const topItems = useMemo(() => {
    const map = {};
    periodLogs.forEach(l => {
      if (!map[l.itemName]) map[l.itemName] = { name: l.itemName, revenue: 0, cost: 0, qty: 0 };
      map[l.itemName].revenue += (l.totalAmount || 0);
      map[l.itemName].cost += (l.purchaseCost || 0);
      map[l.itemName].qty += l.quantity;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [periodLogs]);

  // Staff revenue
  const staffRevenue = useMemo(() => {
    const map = {};
    periodLogs.forEach(l => {
      if (!map[l.staffName]) map[l.staffName] = { name: l.staffName || 'Unknown', revenue: 0, count: 0 };
      map[l.staffName].revenue += (l.totalAmount || 0);
      map[l.staffName].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [periodLogs]);

  // Guest vs Staff rate
  const guestRevenue = periodLogs.filter(l => l.rateType === 'guest').reduce((s, l) => s + (l.totalAmount || 0), 0);
  const staffRateRevenue = periodLogs.filter(l => l.rateType === 'staff').reduce((s, l) => s + (l.totalAmount || 0), 0);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div className="app-header">
        <div>
          <h1>Revenue</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Financial insights, profit margins, and payment breakdown.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
          {[{ k: '7', l: '7 Days' }, { k: '14', l: '14 Days' }, { k: '30', l: '30 Days' }].map(p => (
            <button key={p.k} onClick={() => setPeriod(p.k)} style={{
              padding: '0.4rem 0.75rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: 600,
              background: period === p.k ? 'white' : 'transparent', color: period === p.k ? 'var(--accent-dark)' : 'var(--text-muted)',
              boxShadow: period === p.k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s',
            }}>{p.l}</button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={18} style={{ color: 'var(--accent-color)' }} />, color: 'var(--accent-dark)' },
          { label: 'Total Cost', value: `$${totalCost.toFixed(2)}`, icon: <TrendingUp size={18} style={{ color: 'var(--warning-color)' }} />, color: 'var(--warning-color)' },
          { label: 'Net Profit', value: `$${totalProfit.toFixed(2)}`, icon: <TrendingUp size={18} style={{ color: 'var(--success-color)' }} />, color: totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' },
          { label: 'Profit Margin', value: totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(0)}%` : '—', icon: <DollarSign size={18} style={{ color: '#8b5cf6' }} />, color: '#8b5cf6' },
        ].map((s, i) => (
          <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
              {s.icon}
            </div>
            <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 500, color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend Area Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Revenue vs Profit</h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '0.75rem' }} formatter={v => `$${v.toFixed(2)}`} />
                <Area type="monotone" dataKey="revenue" stroke="#b89771" fill="hsla(35,30%,48%,0.12)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#059669" fill="rgba(5,150,105,0.08)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Payment Split</h3>
          <div style={{ height: '180px' }}>
            {paymentSplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                    <Cell fill="#059669" /><Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No data</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Banknote size={14} style={{ color: '#059669' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>${cashRevenue.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CreditCard size={14} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6' }}>${cardRevenue.toFixed(2)}</span>
            </div>
          </div>
          {/* Guest vs Staff */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <div style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--accent-bg)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-dark)' }}>${guestRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Guest Rate</div>
            </div>
            <div style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#fffbeb', textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--warning-color)' }}>${staffRateRevenue.toFixed(2)}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Staff Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Items + Staff */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Top Revenue Items</h3>
          {topItems.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet.</p> : (
            topItems.map((item, i) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i === 0 ? 'var(--accent-gradient)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? 'white' : 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>×{item.qty} sold • ${item.cost.toFixed(2)} cost</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-dark)', fontSize: '0.9rem' }}>${item.revenue.toFixed(2)}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--success-color)' }}>+${(item.revenue - item.cost).toFixed(2)} profit</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Users size={16} style={{ color: 'var(--accent-color)' }} /> Staff Revenue</h3>
          {staffRevenue.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data yet.</p> : (
            staffRevenue.map((staff) => (
              <div key={staff.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>{staff.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{staff.name}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{staff.count} transactions</div>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent-dark)', fontSize: '0.9rem' }}>${staff.revenue.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
