import { useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { applyOperation, csv, download, emptyOperations, localDate } from '../lib/operations';
import './Operations.css';
import './DashboardRefresh.css';
import { OperationsAnalytics } from '../components/OperationsAnalytics';
import { uploadReceipt, downloadReceipt } from '../lib/receipts';
import { DailyOdometer, OperationsInsights } from '../components/OperationsInsights';

const Field = ({ label, children }) => <label className="ops-field"><span>{label}</span>{children}</label>;
export function Operations({ section }) {
  const { currentUser, showToast } = useAppContext();
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem('cis_operations')) || emptyOperations(); } catch { return emptyOperations(); } });
  const [date, setDate] = useState(localDate);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(!db);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const lock = useRef(false);
  const submitLock = useRef(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (db) {
      let suppliesReady = false, dayReady = false;
      const fail = () => { setReady(false); setError('Unable to connect to shared records. Check your connection and permissions.'); };
      const stockSubscription = onSnapshot(collection(db, 'ops_supplies'), snapshot => {
        setData(previous => ({ ...previous, supplies: snapshot.docs.map(d => d.data()) }));
        suppliesReady = true; setReady(dayReady); setError('');
      }, fail);
      const daySubscription = onSnapshot(doc(db, 'ops_days', date), snapshot => {
        const day = snapshot.exists() ? snapshot.data() : emptyOperations();
        setData(previous => ({ ...emptyOperations(), ...day, supplies: previous.supplies }));
        dayReady = true; setReady(suppliesReady); setError('');
      }, fail);
      return () => { stockSubscription(); daySubscription(); };
    }
    const listener = e => { if (e.key === 'cis_operations' && e.newValue) { try { setData(JSON.parse(e.newValue)); } catch { setError('Unable to read stored records.'); } } };
    window.addEventListener('storage', listener); return () => window.removeEventListener('storage', listener);
  }, [date]);
  const save = async (type, record) => {
    if (lock.current || !ready) return false;
    lock.current = true; setBusy(true); setError('');
    const action = { type, record: { ...record, date, id: record.id || crypto.randomUUID(), staff: currentUser.name, updatedAt: new Date().toISOString() } };
    try {
      if (db) await runTransaction(db, async tx => {
        const ref = doc(db, 'ops_days', date);
        const snapshot = await tx.get(ref);
        const supplyId = type === 'supply' ? action.record.id : type === 'movement' ? action.record.itemId : null;
        const supplyRef = supplyId ? doc(db, 'ops_supplies', supplyId) : null;
        const supplySnapshot = supplyRef ? await tx.get(supplyRef) : null;
        const state = { ...(snapshot.exists() ? snapshot.data() : emptyOperations()), supplies: supplySnapshot?.exists() ? [supplySnapshot.data()] : [] };
        const next = applyOperation(state, action);
        if (supplyRef) tx.set(supplyRef, next.supplies[0]);
        const day = { ...next }; delete day.supplies;
        if (new TextEncoder().encode(JSON.stringify(day)).length > 850000) throw new Error('Daily record capacity reached. Contact your administrator before adding more entries.');
        tx.set(ref, day);
      });
      else {
        const stored = JSON.parse(localStorage.getItem('cis_operations') || 'null') || emptyOperations();
        const next = applyOperation(stored, action);
        localStorage.setItem('cis_operations', JSON.stringify(next)); setData(next);
      }
      showToast('Record saved'); setEditing(null); return true;
    } catch (e) { setError(e.message || 'Unable to save. Please try again.'); return false; }
    finally { setBusy(false); lock.current = false; }
  };
  const submit = type => async e => {
    e.preventDefault(); const form = e.currentTarget;
    if (submitLock.current) return;
    submitLock.current = true;
    try {
      const values = Object.fromEntries(new FormData(form));
      const file = values.receiptFile;
      delete values.receiptFile;
      const receipt = file?.size ? (setUploading(true), await uploadReceipt(file)) : editing?.receipt;
      const record = { ...values, ...(editing && type !== 'movement' && type !== 'mileage' ? { id: editing.id } : {}), ...(type === 'expense' && receipt ? { receipt } : {}) };
      if (await save(type, record)) form.reset();
    } catch (error) { setError(error.message || 'Unable to attach receipt.'); }
    finally { submitLock.current = false; setUploading(false); }
  };
  const department = section === 'breakfast' ? 'Breakfast' : 'Housekeeping';
  const supplies = data.supplies.filter(i => i.department === department);
  const movements = data.movements.filter(i => i.department === department && i.date === date);
  const trips = data.trips.filter(i => i.date === date && !i.deletedAt).sort((a, b) => a.time.localeCompare(b.time));
  const expenses = data.expenses.filter(i => i.date === date);
  const title = { shuttle: 'Shuttle log', breakfast: 'Breakfast inventory', housekeeping: 'Housekeeping inventory', expenses: 'Credit card expenses' }[section];
  const exportRows = section === 'shuttle' ? trips : section === 'expenses' ? expenses : movements;
  const exportData = () => { const headers = [...new Set(exportRows.flatMap(Object.keys))]; download(`${section}-${date}.csv`, csv([headers, ...exportRows.map(r => headers.map(h => r[h]))])); };
  return <div className="operations" key={section}>
    <header className="ops-header"><div><p className="ops-eyebrow">DAILY OPERATIONS</p><h1>{title}</h1></div><div className="ops-actions"><Field label="Business date"><input type="date" required value={date} onChange={e => { if (e.target.value) { setDate(e.target.value); if (db) setReady(false); setEditing(null); } }} /></Field><button className="btn btn-secondary" disabled={!exportRows.length} onClick={exportData}>Export daily CSV</button></div></header>
    {!db && <p className="ops-notice">Local mode — records are saved only in this browser. Shared storage must be configured before using this for hotel operations.</p>}
    {error && <p role="alert" className="ops-error">{error}</p>}
    {!ready && !error && <p role="status">Loading shared records…</p>}
    <fieldset disabled={busy || uploading || !ready} className="ops-workspace">
    <OperationsInsights section={section} supplies={supplies} movements={movements} trips={trips} expenses={expenses} />
    {['breakfast', 'shuttle', 'expenses'].includes(section) && <OperationsAnalytics key={section} section={section} date={date} data={data} save={save} />}
    {['breakfast', 'housekeeping'].includes(section) && <>
      <div className="ops-stats"><article><span>Inventory items</span><strong>{supplies.length}</strong></article><article><span>Low stock items</span><strong>{supplies.filter(i => i.stock <= i.minStock).length}</strong></article><article><span>Usage entries on selected date</span><strong>{movements.filter(i => ['Used', 'Served', 'Wasted'].includes(i.kind)).length}</strong></article></div>
      <div className="ops-columns"><section className="ops-card"><h2>{editing ? 'Edit inventory item' : 'Add inventory item'}</h2><form key={editing?.id || 'new'} onSubmit={submit('supply')} className="ops-form"><input type="hidden" name="department" value={department} /><Field label="Item name"><input name="name" required maxLength={100} defaultValue={editing?.name} /></Field><div className="ops-row"><Field label="On hand"><input name="stock" type="number" min="0" step="0.01" required defaultValue={editing?.stock ?? 0} /></Field><Field label="Low stock threshold"><input name="minStock" type="number" min="0" step="0.01" required defaultValue={editing?.minStock ?? 5} /></Field></div><Field label="Unit (pieces, cartons, bottles)"><input name="unit" required maxLength={30} defaultValue={editing?.unit || 'pieces'} /></Field><button className="btn btn-primary">{busy ? 'Saving…' : 'Save inventory'}</button>{editing && <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel edit</button>}</form></section>
      <section className="ops-card"><h2>{section === 'breakfast' ? 'Record morning usage' : 'Record supply usage'}</h2><form className="ops-form" onSubmit={submit('movement')}><Field label="Inventory item"><select name="itemId" required><option value="">Select item</option>{supplies.map(i => <option key={i.id} value={i.id}>{i.name} · {i.stock} {i.unit}</option>)}</select></Field><div className="ops-row"><Field label="Action"><select name="kind">{section === 'breakfast' ? <><option>Served</option><option>Wasted</option></> : <option>Used</option>}<option>Received</option></select></Field><Field label="Quantity"><input name="quantity" type="number" min="0.01" step="0.01" required /></Field></div><Field label="Notes / room number"><input name="notes" maxLength={300} /></Field><button className="btn btn-primary" disabled={!supplies.length}>Save stock movement</button></form></section></div>
      <section className="ops-card"><h2>Stock on hand</h2><div className="ops-table"><table><thead><tr><th>Item</th><th>Available</th><th>Used on date</th><th>Status</th><th>Action</th></tr></thead><tbody>{supplies.map(i => <tr key={i.id}><td>{i.name}</td><td>{i.stock} {i.unit}</td><td>{movements.filter(m => m.itemId === i.id && ['Used', 'Served', 'Wasted'].includes(m.kind)).reduce((s, m) => s + m.quantity, 0)} {i.unit}</td><td><span className={i.stock <= i.minStock ? 'badge badge-warning' : 'badge badge-success'}>{i.stock <= i.minStock ? 'Reorder' : 'In stock'}</span></td><td><button className="btn btn-secondary" onClick={() => setEditing(i)}>Edit {i.name}</button></td></tr>)}</tbody></table>{!supplies.length && <p className="ops-empty">Add your first {department.toLowerCase()} item to start tracking stock.</p>}</div></section>
      <section className="ops-card"><h2>Daily stock movements</h2><div className="ops-table"><table><thead><tr><th>Item</th><th>Action</th><th>Quantity</th><th>Notes</th><th>Recorded by</th></tr></thead><tbody>{movements.map(m => <tr key={m.id}><td>{m.itemName}</td><td>{m.kind}</td><td>{m.quantity}</td><td>{m.notes || '—'}</td><td>{m.staff}</td></tr>)}</tbody></table>{!movements.length && <p className="ops-empty">No movements recorded for this date.</p>}</div></section>
    </>}
    {section === 'shuttle' && <>
      <div className="ops-stats"><article><span>Trips on selected date</span><strong>{trips.length}</strong></article><article><span>Completed trips</span><strong>{trips.filter(t => t.status === 'Completed').length}</strong></article><article><span>Recorded miles</span><strong>{data.mileage.filter(m => m.date === date && m.end !== '').reduce((s, m) => s + m.end - m.start, 0).toFixed(1)}</strong></article></div>
      <div className="ops-columns"><section className="ops-card"><h2>{editing ? 'Edit trip' : 'Schedule a trip'}</h2><form className="ops-form" key={editing?.id || 'trip'} onSubmit={submit('trip')}><div className="ops-row"><Field label="Room number"><input name="room" required maxLength={15} defaultValue={editing?.room} /></Field><Field label="Pick / drop"><select name="direction" defaultValue={editing?.direction}><option>Pick up</option><option>Drop off</option></select></Field></div><div className="ops-row"><Field label="Time"><input name="time" type="time" required defaultValue={editing?.time} /></Field><Field label="Status"><select name="status" defaultValue={editing?.status}><option>Scheduled</option><option>Completed</option><option>Cancelled</option></select></Field></div><Field label="Destination / driver / notes"><input name="notes" maxLength={300} defaultValue={editing?.notes} /></Field><button className="btn btn-primary">Save trip</button>{editing && <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel edit</button>}</form></section>
      <DailyOdometer readings={data.mileage.filter(m => m.date === date)} save={save} date={date} /></div>
      <section className="ops-card"><h2>Trip schedule</h2><div className="ops-table"><table><thead><tr><th>Time</th><th>Room</th><th>Service</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead><tbody>{trips.map(t => <tr key={t.id}><td>{t.time}</td><td>{t.room}</td><td>{t.direction}</td><td>{t.status}</td><td>{t.notes}</td><td><button className="btn btn-secondary" onClick={() => setEditing(t)}>Edit trip</button><button className="btn ops-delete" onClick={() => save('trip-delete', { id: t.id })}>Delete trip</button></td></tr>)}</tbody></table>{!trips.length && <p className="ops-empty">No shuttle trips scheduled for this date.</p>}</div></section>
      {data.trips.some(t => t.date === date && t.deletedAt) && <details className="ops-card"><summary>Deleted trips · restore a record</summary>{data.trips.filter(t => t.date === date && t.deletedAt).map(t => <div className="ops-deleted-row" key={t.id}><span>{t.time} · Room {t.room} · {t.direction}</span><button className="btn btn-secondary" onClick={() => save('trip-restore', { id: t.id })}>Restore trip</button></div>)}</details>}
    </>}
    {section === 'expenses' && <>
      <div className="ops-stats"><article><span>Credit card spend · selected date</span><strong>${(expenses.reduce((s, e) => s + Math.round(e.amount * 100), 0) / 100).toFixed(2)}</strong></article><article><span>Transactions</span><strong>{expenses.length}</strong></article></div>
      <section className="ops-card"><h2>{editing ? 'Edit expense' : 'Record a card expense'}</h2><form className="ops-form" key={editing?.id || 'expense'} onSubmit={submit('expense')}><div className="ops-row"><Field label="Vendor"><input name="vendor" required maxLength={100} defaultValue={editing?.vendor} /></Field><Field label="Amount ($)"><input name="amount" type="number" required min="0.01" step="0.01" defaultValue={editing?.amount} /></Field></div><div className="ops-row"><Field label="Category"><select name="category" defaultValue={editing?.category}><option>Supplies</option><option>Food & breakfast</option><option>Fuel</option><option>Maintenance</option><option>Other</option></select></Field><Field label="Card last 4 digits (optional)"><input name="card" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} defaultValue={editing?.card} /></Field></div><Field label="Receipt attachment (JPEG, PNG, WebP or PDF, up to 5 MB)"><input name="receiptFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={!db || uploading} /></Field>{editing?.receipt && <p className="analytics-note">Attached: {editing.receipt.name}. Choose a file to replace the attachment.</p>}{uploading && <p role="status">Uploading receipt…</p>}<Field label="Purpose / receipt reference"><input name="notes" required maxLength={300} defaultValue={editing?.notes} /></Field><button className="btn btn-primary">Save expense</button>{editing && <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel edit</button>}</form></section>
      <section className="ops-card"><h2>Daily expenses</h2><div className="ops-table"><table><thead><tr><th>Vendor</th><th>Category</th><th>Card</th><th>Amount</th><th>Purpose / receipt</th><th>Recorded by</th><th>Action</th></tr></thead><tbody>{expenses.map(e => <tr key={e.id}><td>{e.vendor}</td><td>{e.category}</td><td>{e.card ? `•••• ${e.card}` : '—'}</td><td>${e.amount.toFixed(2)}</td><td>{e.notes}{e.receipt && <div><button className="btn btn-secondary" onClick={async () => { try { await downloadReceipt(e.receipt); } catch { setError('Unable to download receipt. Check your connection and staff access.'); } }}>Download receipt</button></div>}</td><td>{e.staff}</td><td><button className="btn btn-secondary" onClick={() => setEditing(e)}>Edit expense</button></td></tr>)}</tbody></table>{!expenses.length && <p className="ops-empty">No credit card expenses recorded for this date.</p>}</div></section>
    </>}
    </fieldset>
  </div>;
}
