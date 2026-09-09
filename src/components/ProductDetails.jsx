import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { dateKey, shiftDate, stockEstimate } from '../lib/analytics';
import { DetailDialog, TrendChart } from './Analytics';

export function ProductDetails({ item, onClose }) {
  const { logs } = useAppContext();
  const [local] = useState(() => { try { return { history: db ? [] : JSON.parse(localStorage.getItem('cis_item_history') || '[]').filter(row => row.itemId === item.id), error: '' }; } catch { return { history: [], error: 'Change history could not be read.' }; } });
  const [history, setHistory] = useState(local.history);
  const [error, setError] = useState(local.error);
  const [loading, setLoading] = useState(Boolean(db));
  useEffect(() => {
    if (db) return onSnapshot(query(collection(db, 'item_history'), where('itemId', '==', item.id)), snapshot => { setHistory(snapshot.docs.map(doc => doc.data())); setLoading(false); }, () => { setError('Change history could not be loaded. Please reopen this product.'); setLoading(false); });
  }, [item.id]);
  const today = dateKey(new Date());
  const issues = logs.filter(row => String(row.itemId) === String(item.id));
  const estimate = stockEstimate(item, logs, today);
  const events = [...history.map(row => ({ ...row, summary: row.changes.map(change => change.field === 'image' ? 'Product photo updated' : `${change.field}: ${change.before ?? 'not set'} → ${change.after}`).join(' · ') })), ...issues.map(row => ({ ...row, staff: row.staffName, summary: `${row.quantity} issued${row.stockBefore !== undefined ? ` · Stock ${row.stockBefore} → ${row.stockAfter}` : ''}${row.roomNumber ? ` · Room ${row.roomNumber}` : ''}` }))].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return <DetailDialog title={item.name} onClose={onClose}>
    <div className="analytics-grid"><div>{item.image ? <img className="analytics-photo" src={item.image} alt={item.name} /> : <p className="analytics-panel">No product photo yet.</p>}</div><div><p>{item.category}</p><div className="analytics-metrics"><article><span>Available now</span><strong>{item.stock}</strong><small>Minimum {item.minStock}</small></article><article><span>Estimated stock remaining</span><strong>{estimate ? `${estimate.days.toFixed(1)} days` : '—'}</strong><small>{estimate ? `${estimate.daily.toFixed(2)} units/day recorded over ${estimate.observedDays} days` : 'Insufficient history: needs 7 days and usage on 3 different days.'}</small></article></div><p className="analytics-note">Estimate uses up to 30 days of recorded issues. Unrecorded usage and future demand can change actual stock needs.</p>{!Number(item.purchaseRate) && <p className="analytics-warning">Purchase cost is zero or missing. Confirm whether this is correct.</p>}</div></div>
    <TrendChart title="Daily usage · last 30 days" bars data={Array.from({ length: 30 }, (_, index) => { const date = shiftDate(today, index - 29); return { date, used: issues.filter(row => dateKey(row.timestamp) === date).reduce((sum, row) => sum + row.quantity, 0) }; })} series={[{ key: 'used', name: 'Units issued' }]} />
    <section className="analytics-panel"><h2>Stock history & recent changes</h2><p className="analytics-note">Product edits are tracked from this release onward. Issue entries reflect the current activity log; earlier edits and removed logs cannot be reconstructed.</p>{loading && <p role="status">Loading history…</p>}{error && <p role="alert">{error}</p>}<div className="analytics-table"><table><thead><tr><th>When</th><th>Activity</th><th>Staff</th></tr></thead><tbody>{events.slice(0, 100).map(row => <tr key={row.id}><td>{new Date(row.timestamp).toLocaleString()}</td><td>{row.summary}</td><td>{row.staff || '—'}</td></tr>)}</tbody></table></div>{!events.length && !loading && <p>No recorded changes yet.</p>}{events.length > 100 && <p>Showing the latest 100 entries.</p>}</section>
  </DetailDialog>;
}
