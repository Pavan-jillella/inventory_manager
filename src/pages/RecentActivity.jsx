import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Package, Search, FileText, CreditCard, Banknote, Sun, Sunset, Moon, LayoutGrid, List, Edit2, Trash2, Check, X, Minus, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SHIFTS } from '../data/mockData';

const SHIFT_ICONS = { morning: Sun, afternoon: Sunset, night: Moon };
const SHIFT_COLORS = {
  morning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', text: '#b45309' },
  afternoon: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#c2410c' },
  night: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#4338ca' },
};

export const RecentActivity = () => {
  const { logs, updateLog, deleteLog } = useAppContext();
  const [filter, setFilter] = useState('today');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('shifts');
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(1);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        if (filter === 'today' && logDate.toDateString() !== now.toDateString()) return false;
        if (filter === 'week') { const diff = Math.ceil(Math.abs(now - logDate) / (1000 * 60 * 60 * 24)); if (diff > 7) return false; }
      }
      if (searchText) {
        const q = searchText.toLowerCase();
        return log.itemName.toLowerCase().includes(q) || log.staffName?.toLowerCase().includes(q) || log.roomNumber?.toLowerCase().includes(q);
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
      groups[s.id] = { shift: s, logs: shiftLogs, totalItems, totalAmount, cashAmount, cardAmount, totalEntries: shiftLogs.length };
    });
    return groups;
  }, [filteredLogs]);

  const startEdit = (log) => { setEditingId(log.id); setEditQty(log.quantity); };
  const saveEdit = (logId) => { updateLog(logId, { quantity: editQty }); setEditingId(null); };
  const confirmDelete = (logId) => { if (window.confirm('Delete this entry? Stock will be restored.')) deleteLog(logId); };

  const exportCSV = () => {
    const headers = 'Time,Item,Category,Qty,Rate Type,Unit Rate,Amount,Payment,Room,Staff,Shift\n';
    const rows = filteredLogs.map(l => `"${new Date(l.timestamp).toLocaleString()}","${l.itemName}","${l.itemCategory}",${l.quantity},"${l.rateType}",${l.unitRate},${l.totalAmount},"${l.paymentMethod || ''}","${l.roomNumber}","${l.staffName}","${l.shiftLabel}"`).join('\n');
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
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Track issues with shift breakdowns. Edit or delete entries.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.15rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <button onClick={() => setViewMode('shifts')} style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: viewMode === 'shifts' ? 'white' : 'transparent', boxShadow: viewMode === 'shifts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'shifts' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><LayoutGrid size={15} /></button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.35rem 0.5rem', borderRadius: '0.35rem', background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'list' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><List size={15} /></button>
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}><FileText size={14} /> Export</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.55rem 1rem 0.55rem 2.5rem', fontSize: '0.85rem' }} placeholder="Search items, staff..." />
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[{ key: 'today', label: 'Today' }, { key: 'week', label: 'This Week' }, { key: 'all', label: 'All Time' }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`btn ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} style={{ borderRadius: '999px', padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', textAlign: 'center' }}>
            <Package size={48} style={{ color: 'var(--text-muted)', opacity: 0.15, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>No activity found for the selected period.</p>
          </div>
        ) : viewMode === 'shifts' ? (
          /* ── SHIFT CARDS VIEW ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.25rem', paddingBottom: '1rem' }}>
            {Object.values(shiftGroups).map(group => {
              const ShiftIcon = SHIFT_ICONS[group.shift.id];
              const colors = SHIFT_COLORS[group.shift.id];
              return (
                <motion.div key={group.shift.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}><ShiftIcon size={16} style={{ color: colors.text }} /></div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: colors.text }}>{group.shift.label} Shift</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{group.shift.start}:00 – {group.shift.end}:00</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: colors.text }}>${group.totalAmount.toFixed(2)}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{group.totalEntries} entries · {group.totalItems} items</div>
                    </div>
                  </div>
                  {/* Cash/Card */}
                  <div style={{ display: 'flex', gap: '0.5rem', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.8)', borderRadius: '0.4rem', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <Banknote size={13} style={{ color: 'var(--success-color)' }} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cash</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, marginLeft: 'auto', color: 'var(--success-color)' }}>${group.cashAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.8)', borderRadius: '0.4rem', border: '1px solid rgba(0,0,0,0.04)' }}>
                      <CreditCard size={13} style={{ color: '#3b82f6' }} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Card</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, marginLeft: 'auto', color: '#3b82f6' }}>${group.cardAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Items with edit/delete */}
                  <div style={{ padding: '0.25rem 0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                    {group.logs.map(log => (
                      <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '0.35rem', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{log.itemName}</span>
                            {log.roomNumber && <span style={{ fontSize: '0.6rem', color: 'var(--accent-dark)', fontWeight: 600 }}>#{log.roomNumber}</span>}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                            {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {log.staffName} · {log.paymentMethod || 'cash'} · {log.rateType}
                          </div>
                        </div>
                        {editingId === log.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <button onClick={() => setEditQty(Math.max(1, editQty - 1))} style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}><Minus size={10} /></button>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>{editQty}</span>
                            <button onClick={() => setEditQty(editQty + 1)} style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}><Plus size={10} /></button>
                            <button onClick={() => saveEdit(log.id)} style={{ padding: '0.2rem', color: 'var(--success-color)' }}><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '0.2rem', color: 'var(--text-muted)' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>×{log.quantity}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-dark)', minWidth: '44px', textAlign: 'right' }}>${log.totalAmount?.toFixed(2)}</span>
                            <button onClick={() => startEdit(log)} style={{ padding: '0.15rem', color: 'var(--text-muted)', opacity: 0.5 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.5}><Edit2 size={12} /></button>
                            <button onClick={() => confirmDelete(log.id)} style={{ padding: '0.15rem', color: 'var(--danger-color)', opacity: 0.5 }} onMouseOver={e => e.currentTarget.style.opacity = 1} onMouseOut={e => e.currentTarget.style.opacity = 0.5}><Trash2 size={12} /></button>
                          </div>
                        )}
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
                <tr><th>Time</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Payment</th><th>Room</th><th>Staff</th><th>Shift</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={log.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}><Clock size={11} />{new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></td>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.itemName}</td>
                    <td>
                      {editingId === log.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <button onClick={() => setEditQty(Math.max(1, editQty - 1))} style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={9} /></button>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '16px', textAlign: 'center' }}>{editQty}</span>
                          <button onClick={() => setEditQty(editQty + 1)} style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={9} /></button>
                        </div>
                      ) : <span style={{ fontWeight: 600 }}>{log.quantity}</span>}
                    </td>
                    <td><span className={`badge ${log.rateType === 'staff' ? 'badge-warning' : 'badge-accent'}`} style={{ fontSize: '0.5rem' }}>{log.rateType}</span> <span style={{ fontSize: '0.75rem' }}>${log.unitRate?.toFixed(2)}</span></td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>${editingId === log.id ? (log.unitRate * editQty).toFixed(2) : log.totalAmount?.toFixed(2)}</td>
                    <td>{log.paymentMethod === 'card' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#3b82f6' }}><CreditCard size={11} /> Card</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--success-color)' }}><Banknote size={11} /> Cash</span>}</td>
                    <td>{log.roomNumber ? <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>#{log.roomNumber}</span> : '—'}</td>
                    <td style={{ fontSize: '0.8rem' }}>{log.staffName}</td>
                    <td><span className="badge badge-accent" style={{ fontSize: '0.5rem' }}>{log.shiftLabel}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === log.id ? (
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => saveEdit(log.id)} style={{ padding: '0.2rem', color: 'var(--success-color)' }}><Check size={14} /></button>
                          <button onClick={() => setEditingId(null)} style={{ padding: '0.2rem', color: 'var(--text-muted)' }}><X size={14} /></button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.2rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }} onClick={() => startEdit(log)}><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '0.25rem', color: 'var(--danger-color)' }} onClick={() => confirmDelete(log.id)}><Trash2 size={13} /></button>
                        </div>
                      )}
                    </td>
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
