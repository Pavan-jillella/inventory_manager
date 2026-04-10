import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, User as UserIcon, Package, Hash, Filter, FileText, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const RecentActivity = () => {
  const { logs } = useAppContext();
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Time filter
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
      // Text filter
      if (searchText) {
        const q = searchText.toLowerCase();
        return log.itemName.toLowerCase().includes(q) ||
          log.staffName?.toLowerCase().includes(q) ||
          log.roomNumber?.toLowerCase().includes(q) ||
          log.guestName?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, filter, searchText]);

  const exportCSV = () => {
    const header = 'Time,Item,Category,Qty,Staff,Room,Guest,Shift,Notes\n';
    const rows = filteredLogs.map(l =>
      `"${new Date(l.timestamp).toLocaleString()}","${l.itemName}","${l.itemCategory || ''}",${l.quantity},"${l.staffName}","${l.roomNumber}","${l.guestName || ''}","${l.shiftLabel || ''}","${l.notes || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `activity-log-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Activity Log</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Complete audit trail of all issued items.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="text"
            className="input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search logs..."
            style={{ width: '180px', fontSize: '0.85rem' }}
          />
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minWidth: '130px', fontSize: '0.85rem' }}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <FileText size={14} /> Export
          </button>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Room</th>
              <th>Issued By</th>
              <th>Shift</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Package size={36} style={{ marginBottom: '0.75rem', opacity: 0.15 }} />
                  <p>No activity found for the selected period.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, index) => (
                <motion.tr
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.5) }}
                  key={log.id}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <Clock size={13} />
                      {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{log.itemName}</span>
                      <span className="badge badge-accent" style={{ fontSize: '0.55rem' }}>{log.itemCategory}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ArrowDownRight size={13} style={{ color: 'var(--warning-color)' }} />
                      <span style={{ fontWeight: 600 }}>{log.quantity}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${log.rateType === 'staff' ? 'badge-warning' : 'badge-accent'}`} style={{ fontSize: '0.55rem' }}>
                      {log.rateType || 'guest'}
                    </span>
                    <span style={{ fontSize: '0.8rem', marginLeft: '0.35rem', color: 'var(--text-secondary)' }}>${log.unitRate?.toFixed(2) || '—'}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>${log.totalAmount?.toFixed(2) || '—'}</span>
                  </td>
                  <td>
                    {log.roomNumber ? (
                      <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>#{log.roomNumber}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>
                        {log.staffName?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{log.staffName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-accent" style={{ fontSize: '0.6rem' }}>{log.shiftLabel || '—'}</span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
