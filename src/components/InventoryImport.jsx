import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { csv, download, parseInventory } from '../lib/operations';
export function InventoryImport() {
  const { importItems } = useAppContext();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const columns = ['name', 'category', 'stock', 'minStock', 'purchaseRate', 'staffRate', 'guestRate'];
  const read = async e => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    setError(''); setRows([]);
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('Choose a file smaller than 2 MB.');
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'tsv', 'json'].includes(ext)) throw new Error('Supported inventory files: CSV, TSV, and JSON. Export Excel or PDF tables as CSV first.');
      setRows(parseInventory(await file.text(), ext));
    } catch (e) { setError(e.message); }
  };
  const commit = async () => {
    setBusy(true); setError('');
    try { const validated = parseInventory(JSON.stringify(rows), 'json'); await importItems(validated); setRows([]); }
    catch (e) { setError(e.message || 'Import failed. Your file has not been saved.'); }
    finally { setBusy(false); }
  };
  return <section className="ops-card" style={{ marginBottom: '1rem' }}><div className="ops-header"><div><h2>Import inventory</h2><p>Upload CSV, TSV, or JSON. Review and edit every row before adding it.</p></div><div className="ops-actions"><button className="btn btn-secondary" onClick={() => download('inventory-template.csv', csv([columns, ['Orange juice', 'Breakfast', 12, 5, 2, 2.5, 3]]))}>Download template</button><label className="btn btn-secondary">Choose file<input aria-label="Import inventory file" type="file" accept=".csv,.tsv,.json" disabled={busy} onChange={read} style={{ maxWidth: '210px' }} /></label></div></div>{error && <p className="ops-error" role="alert">{error}</p>}{rows.length > 0 && <><p>{rows.length} new items. Existing items are preserved; remove duplicates before importing.</p><div className="ops-table"><table><thead><tr>{columns.map(c => <th key={c}>{c}</th>)}<th>Remove</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map(c => <td key={c}><input aria-label={`Row ${index + 1} ${c}`} value={row[c]} disabled={busy} onChange={e => setRows(prev => prev.map((r, i) => i === index ? { ...r, [c]: e.target.value } : r))} style={{ width: c === 'name' ? '180px' : '95px', padding: '.5rem' }} /></td>)}<td><button className="btn btn-secondary" disabled={busy} onClick={() => setRows(prev => prev.filter((_, i) => i !== index))}>Remove row {index + 1}</button></td></tr>)}</tbody></table></div><div className="ops-actions" style={{ marginTop: '1rem' }}><button className="btn btn-primary" disabled={busy} onClick={commit}>{busy ? 'Importing…' : `Import ${rows.length} items`}</button><button className="btn btn-secondary" disabled={busy} onClick={() => setRows([])}>Cancel</button></div></>}</section>;
}
