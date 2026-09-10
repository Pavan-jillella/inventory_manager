import { useEffect, useState } from 'react';
import { collection, doc, documentId, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { shiftDate, sumMoney, weeklyMileage } from '../lib/analytics';
import { TrendChart } from './Analytics';
import { BudgetGauge, DonutChart } from './VisualCharts';

export function OperationsAnalytics({ section, date, data, save }) {
  const weekStart = shiftDate(date, -6);
  const month = date.slice(0, 7);
  const monthStart = `${month}-01`;
  const from = weekStart < monthStart ? weekStart : monthStart;
  const monthEnd = shiftDate(`${Number(month.slice(0, 4)) + (month.endsWith('-12') ? 1 : 0)}-${String(Number(month.slice(5)) % 12 + 1).padStart(2, '0')}-01`, -1);
  const [remote, setRemote] = useState({ key: '', days: [], error: '' });
  const key = `${from}/${monthEnd}`;
  useEffect(() => {
    if (!db) return;
    return onSnapshot(query(collection(db, 'ops_days'), where(documentId(), '>=', from), where(documentId(), '<=', monthEnd)), snapshot => setRemote({ key, days: snapshot.docs.map(doc => doc.data()), error: '' }), () => setRemote({ key, days: [], error: 'Unable to load historical operations. Check your connection and reopen this page.' }));
  }, [from, monthEnd, key]);
  const days = db ? remote.days : [data];
  const loaded = !db || remote.key === key;
  return <div>
    {!loaded ? <p role="status">Loading trends…</p> : remote.error ? <p role="alert" className="analytics-warning">{remote.error}</p> : <>
      {section === 'breakfast' && <BreakfastTrends {...{ date, days, data, save }} />}
      {section === 'shuttle' && <ShuttleTrends {...{ date, days, data }} />}
      {section === 'expenses' && <ExpenseTrends {...{ date, days, month }} />}
    </>}
  </div>;
}

function BreakfastTrends({ date, days, data, save }) {
  const supplies = data.supplies.filter(item => item.department === 'Breakfast');
  const [chosen, setChosen] = useState('');
  const item = supplies.find(item => item.id === chosen) || supplies[0];
  const movements = days.flatMap(day => day.movements || []);
  const guests = days.flatMap(day => day.breakfastGuests || []);
  const count = guests.find(row => row.date === date);
  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = shiftDate(date, index - 6);
    const rows = movements.filter(row => row.date === day && row.itemId === item?.id);
    const total = kind => rows.filter(row => row.kind === kind).reduce((sum, row) => sum + row.quantity, 0);
    return { date: day, served: total('Served'), wasted: total('Wasted'), unclassified: total('Used') };
  });
  const selected = chart[6];
  return <>
    <div className="analytics-grid"><section className="analytics-panel"><h2>Breakfast guest count</h2><form key={`${date}-${count?.updatedAt || ''}`} className="ops-form" onSubmit={async event => { event.preventDefault(); await save('breakfast-guests', Object.fromEntries(new FormData(event.currentTarget))); }}><label className="ops-field"><span>Guests served on {date}</span><input name="count" type="number" min="0" step="1" required defaultValue={count?.count ?? ''} /></label><button className="btn btn-primary">Save guest count</button></form><p className="analytics-note">Record the actual breakfast guest count. Updating this replaces the count for this date.</p></section><section className="analytics-panel"><h2>Served, wasted & per guest</h2><label className="ops-field"><span>Compare one inventory item</span><select aria-label="Breakfast chart item" value={item?.id || ''} onChange={event => setChosen(event.target.value)}>{supplies.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label><div className="analytics-metrics"><article><span>Served per guest · selected day</span><strong>{item && count?.count > 0 && selected.served > 0 ? (selected.served / count.count).toFixed(2) : '—'}</strong><small>{item?.unit || 'units'} per guest</small></article><article><span>Waste · selected day</span><strong>{selected.wasted.toLocaleString()}</strong><small>{item?.unit || 'units'} recorded</small></article></div><p className="analytics-note">Choose Served or Wasted when recording stock usage. Earlier Used entries remain unclassified. Quantities from different items are never combined.</p></section></div>
    {item && <div className="analytics-grid"><DonutChart title="Breakfast usage mix · selected week" data={[{ label: 'Served', amount: chart.reduce((sum, row) => sum + row.served, 0) }, { label: 'Wasted', amount: chart.reduce((sum, row) => sum + row.wasted, 0) }, { label: 'Unclassified', amount: chart.reduce((sum, row) => sum + row.unclassified, 0) }]} unit={item.unit} note={`${item.name} only. Earlier Used entries remain unclassified.`} /><TrendChart title={`${item.name} · weekly breakfast usage`} data={chart} bars series={[{ key: 'served', name: `Served (${item.unit})` }, { key: 'wasted', name: `Wasted (${item.unit})` }, { key: 'unclassified', name: `Unclassified (${item.unit})` }]} note="Zero means no quantity recorded for that action. Served-per-guest needs a guest count and a served entry." /></div>}
  </>;
}

function ShuttleTrends({ date, days, data }) {
  const trips = data.trips.filter(row => row.date === date && !row.deletedAt).sort((a, b) => a.time.localeCompare(b.time));
  const readings = data.mileage.filter(row => row.date === date);
  const incomplete = readings.filter(row => row.end === '');
  return <>
    {!readings.length && <p className="analytics-warning">No starting odometer reading for {date}. Record the morning reading before using the shuttle.</p>}
    {incomplete.length > 0 && <p className="analytics-warning">Ending odometer needed: {incomplete.map(row => row.vehicle).join(', ')}. Complete these readings when each vehicle’s day is finished.</p>}
    <div className="analytics-grid"><section className="analytics-panel"><h2>Daily trip timeline</h2>{trips.length ? <ol className="analytics-timeline">{trips.map(trip => <li key={trip.id}><time>{trip.time}</time><div><strong>Room {trip.room} · {trip.direction}</strong><span>{trip.status} · {trip.notes || 'No notes'}</span></div></li>)}</ol> : <p>No trips scheduled for this day.</p>}</section><TrendChart area title="Weekly shuttle mileage" data={weeklyMileage(days, date)} series={[{ key: 'miles', name: 'Completed miles' }]} note="Gaps mean no completed reading. Days with open readings may have partial totals; see the table below." /></div>
    <div className="analytics-table"><table><thead><tr><th>Day</th><th>Open vehicle readings</th></tr></thead><tbody>{weeklyMileage(days, date).filter(row => row.incomplete).map(row => <tr key={row.date}><td>{row.date}</td><td>{row.incomplete}</td></tr>)}</tbody></table></div>
  </>;
}

function ExpenseTrends({ days, month }) {
  const { currentUser } = useAppContext();
  const [budgetState, setBudgetState] = useState({ month: '', value: null, error: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (db) return onSnapshot(doc(db, 'ops_budgets', month), snapshot => setBudgetState({ month, value: snapshot.exists() ? snapshot.data().amount : null, error: '' }), () => setBudgetState({ month, value: null, error: 'Unable to load budget.' }));
    try { setBudgetState({ month, value: JSON.parse(localStorage.getItem('cis_budgets') || '{}')[month] ?? null, error: '' }); }
    catch { setBudgetState({ month, value: null, error: 'Unable to read budget.' }); }
  }, [month]);
  const rows = days.flatMap(day => day.expenses || []).filter(row => row.date.startsWith(month));
  const spent = sumMoney(rows, 'amount');
  const budget = budgetState.month === month ? budgetState.value : null;
  const groups = field => [...new Set(rows.map(row => row[field] || 'Other'))].map(label => ({ label, amount: sumMoney(rows.filter(row => (row[field] || 'Other') === label), 'amount') })).sort((a, b) => b.amount - a.amount);
  return <>
    <section className="analytics-panel"><h2>Monthly card budget · {month}</h2><div className="analytics-metrics"><article><span>Recorded spend · full month</span><strong>${spent.toFixed(2)}</strong></article><article><span>Budget</span><strong>{budget === null ? 'Not set' : `$${budget.toFixed(2)}`}</strong></article><article><span>{budget !== null && spent > budget ? 'Over budget' : 'Remaining'}</span><strong>{budget === null ? '—' : `$${Math.abs(budget - spent).toFixed(2)}`}</strong></article></div><BudgetGauge spent={spent} budget={budget} />{budget !== null && spent > budget && <p className="analytics-warning">Recorded expenses exceed this month’s budget by ${(spent - budget).toFixed(2)}.</p>}{budgetState.error && <p role="alert">{budgetState.error}</p>}{currentUser.role === 'Admin' && <form key={`${month}-${budget}`} className="analytics-filters" onSubmit={async event => { event.preventDefault(); if (saving) return; const amount = Number(new FormData(event.currentTarget).get('amount')); if (!Number.isFinite(amount) || amount < 0) return; setSaving(true); setMessage(''); try { const value = Math.round(amount * 100) / 100; if (db) await setDoc(doc(db, 'ops_budgets', month), { amount: value, updatedAt: new Date().toISOString(), staffId: currentUser.id }); else { const all = JSON.parse(localStorage.getItem('cis_budgets') || '{}'); localStorage.setItem('cis_budgets', JSON.stringify({ ...all, [month]: value })); setBudgetState({ month, value, error: '' }); } setMessage('Budget saved.'); } catch { setMessage('Budget could not be saved. Please retry.'); } finally { setSaving(false); } }}><label>Monthly limit ($)<input name="amount" aria-label="Monthly card budget" type="number" step="0.01" min="0" required defaultValue={budget ?? ''} /></label><button className="btn btn-outline" disabled={saving}>{saving ? 'Saving…' : 'Save budget'}</button></form>}{message && <p role="status">{message}</p>}<p className="analytics-note">Only administrators can change budgets. Charts include every recorded expense in the selected month.</p></section>
    <div className="analytics-grid"><DonutChart title="Monthly spend by category" data={groups('category')} currency note="Each slice shows its share of this month’s recorded card expenses." /><TrendChart title="Monthly spend by vendor" data={groups('vendor')} label="label" bars series={[{ key: 'amount', name: 'Spend ($)' }]} /></div>
  </>;
}
