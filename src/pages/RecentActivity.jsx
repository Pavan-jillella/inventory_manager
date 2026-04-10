import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Package, Search, FileText, ArrowDownRight, CreditCard, Banknote, Sun, Sunset, Moon, LayoutGrid, List } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SHIFTS } from '../data/mockData';

const SHIFT_ICONS = { morning: Sun, afternoon: Sunset, night: Moon };
const SHIFT_COLORS = {
  morning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#b45309' },
  afternoon: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#c2410c' },
  night: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#4338ca' },
};

export const RecentActivity = () => {
  const { logs } = useAppContext();
  const [filter, setFilter] = useState('today');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('shifts'); // 'shifts' or 'list'

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (filter === 'today') {
          if (logDate.toDateString() !== now.toDateString()) return false;
        }
        if (filter === 'week') {
          const diffDays = Math.ceil(Math.abs(now - logDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 7) return false;
        }
      }
      if (searchText) {
        const q = searchText.toLowerCase();
        return log.itemName.toLowerCase().includes(q) ||
          log.staffName?.toLowerCase().includes(q) ||
          log.roomNumber?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, filter, searchText]);

  // Group by shift
  const shiftGroups = useMemo(() => {
    const groups = {};
    SHIFTS.forEach(s => {
      const shiftLogs = filteredLogs.filter(l => l.shift === s.id);
      if (shiftLogs.length === 0) return;
      const totalItems = shiftLogs.reduce((sum, l) => sum + l.quantity, 0);
      const totalAmount = shiftLogs.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
      const cashAmount = shiftLogs.filter(l => l.paymentMethod === 'cash').reduce((s, l) => s + (l.totalAmount || 0), 0);
      const cardAmount = shiftLogs.filter(l => l.paymentMethod === 'card').reduce((s, l) => s + (l.totalAmount || 0), 0);
      // Group items
      const itemMap = {};
      shiftLogs.forEach(l => {
        if (!itemMap[l.itemName]) itemMap[l.itemName] = { name: l.itemName, category: l.itemCategory, qty: 0, amount: 0 };
        itemMap[l.itemName].qty += l.quantity;
        itemMap[l.itemName].amount += (l.totalAmount || 0);
      });
      groups[s.id] = {
        shift: s,
        logs: shiftLogs,
        totalItems,
        totalAmount,
        cashAmount,
        cardAmount,
        uniqueItems: Object.values(itemMap).sort((a, b) => b.qty - a.qty),
        totalEntries: shiftLogs.length,
      };
    });
    return groups;
  }, [filteredLogs]);

  const exportCSV = () => {
    const headers = 'Time,Item,Category,Qty,Rate Type,Unit Rate,Amount,Payment,Room,Staff,Shift\n';
    const rows = filteredLogs.map(l =>
      `"${new Date(l.timestamp).toLocaleString()}","${l.itemName}","${l.itemCategory}",${l.quantity},"${l.rateType}",${l.unitRate},${l.totalAmount},"${l.paymentMethod || ''}","${l.roomNumber}","${l.staffName}","${l.shiftLabel}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Activity Log</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Track all issued items with shift breakdowns.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '0.15rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <button onClick={() => setViewMode('shifts')} style={{
              padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: viewMode === 'shifts' ? 'white' : 'transparent',
              boxShadow: viewMode === 'shifts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'shifts' ? 'var(--accent-dark)' : 'var(--text-muted)',
            }}><LayoutGrid size={15} /></button>
            <button onClick={() => setViewMode('list')} style={{
              padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: viewMode === 'list' ? 'white' : 'transparent',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'list' ? 'var(--accent-dark)' : 'var(--text-muted)',
            }}><List size={15} /></button>
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}><FileText size={14} /> Export</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={searchText} onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.55rem 1rem 0.55rem 2.5rem', fontSize: '0.85rem' }} placeholder="Search items, staff..." />
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'all', label: 'All Time' }].map(f => (
            <button key={f.key}
              onClick={() => setFilter(f.key)}
              className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '999px', padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', textAlign: 'center' }}>
            <Package size={48} style={{ color: 'var(--text-muted)', opacity: 0.15, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No activity found for the selected period.</p>
          </div>
        ) : viewMode === 'shifts' ? (
          /* ── SHIFT CARDS VIEW ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem', paddingBottom: '1rem' }}>
            {Object.values(shiftGroups).map(group => {
              const ShiftIcon = SHIFT_ICONS[group.shift.id];
              const colors = SHIFT_COLORS[group.shift.id];
              return (
                <motion.div
                  key={group.shift.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 4px 30px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Shift Header */}
                  <div style={{
                    padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: colors.bg, borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <ShiftIcon size={16} style={{ color: colors.text }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.text }}>{group.shift.label} Shift</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{group.shift.start}:00 – {group.shift.end}:00</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: colors.text }}>${group.totalAmount.toFixed(2)}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{group.totalEntries} entries · {group.totalItems} items</div>
                    </div>
                  </div>

                  {/* Cash vs Card Row */}
                  <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.65rem',
                      background: 'rgba(255,255,255,0.8)', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      <Banknote size={14} style={{ color: 'var(--success-color)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cash</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: 'auto', color: 'var(--success-color)' }}>${group.cashAmount.toFixed(2)}</span>
                    </div>
                    <div style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.65rem',
                      background: 'rgba(255,255,255,0.8)', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      <CreditCard size={14} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Card</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, marginLeft: 'auto', color: '#3b82f6' }}>${group.cardAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Items Breakdown */}
                  <div style={{ padding: '0.5rem 0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
                    {group.uniqueItems.map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.5rem', borderRadius: '0.35rem', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.name}</span>
                          <span className="badge badge-accent" style={{ fontSize: '0.5rem' }}>{item.category}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×{item.qty}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-dark)', minWidth: '50px', textAlign: 'right' }}>${item.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Room</th>
                  <th>Staff</th>
                  <th>Shift</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.4) }}
                    key={log.id}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <Clock size={12} />
                        {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.itemName}</span>
                        <span className="badge badge-accent" style={{ fontSize: '0.5rem' }}>{log.itemCategory}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <ArrowDownRight size={12} style={{ color: 'var(--warning-color)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.quantity}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${log.rateType === 'staff' ? 'badge-warning' : 'badge-accent'}`} style={{ fontSize: '0.5rem' }}>{log.rateType || 'guest'}</span>
                      <span style={{ fontSize: '0.75rem', marginLeft: '0.3rem', color: 'var(--text-secondary)' }}>${log.unitRate?.toFixed(2)}</span>
                    </td>
                    <td><span style={{ fontWeight: 600, color: 'var(--accent-dark)', fontSize: '0.85rem' }}>${log.totalAmount?.toFixed(2)}</span></td>
                    <td>
                      {log.paymentMethod === 'card' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 500 }}><CreditCard size={12} /> Card</span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success-color)', fontWeight: 500 }}><Banknote size={12} /> Cash</span>
                      )}
                    </td>
                    <td>
                      {log.roomNumber ? (
                        <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>#{log.roomNumber}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.55rem', fontWeight: 700 }}>
                          {log.staffName?.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.8rem' }}>{log.staffName}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-accent" style={{ fontSize: '0.55rem' }}>{log.shiftLabel || '—'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
