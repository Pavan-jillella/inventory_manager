export const localDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const emptyOperations = () => ({ supplies: [], movements: [], trips: [], mileage: [], expenses: [] });
export function number(value, label, minimum = 0) {
  if (String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < minimum) throw new Error(`${label} must be ${minimum === 0 ? 'zero or greater' : `at least ${minimum}`}.`);
  return Number(value);
}
export function applyOperation(state, action) {
  const next = structuredClone(state);
  const record = { ...action.record };
  if (!record.id) throw new Error('Missing record ID.');
  if (action.type === 'supply') {
    record.name = String(record.name || '').trim();
    if (!record.name) throw new Error('Item name is required.');
    if (!['Breakfast', 'Housekeeping'].includes(record.department)) throw new Error('Choose a department.');
    record.stock = number(record.stock, 'Stock');
    record.minStock = number(record.minStock, 'Minimum stock');
    const old = next.supplies.find(i => i.id === record.id);
    if (old && old.stock !== record.stock) next.movements.unshift({ id: crypto.randomUUID(), itemId: record.id, itemName: record.name, department: record.department, date: record.date, quantity: Math.abs(record.stock - old.stock), kind: 'Adjustment', notes: `Stock corrected from ${old.stock} to ${record.stock}`, staff: record.staff });
    next.supplies = [...next.supplies.filter(i => i.id !== record.id), record];
  } else if (action.type === 'movement') {
    const item = next.supplies.find(i => i.id === record.itemId);
    if (!item) throw new Error('Select an inventory item.');
    record.quantity = number(record.quantity, 'Quantity', 0.01);
    if (!['Used', 'Received'].includes(record.kind)) throw new Error('Invalid inventory action.');
    if (record.kind === 'Used' && item.stock < record.quantity) throw new Error(`Only ${item.stock} ${item.unit} available.`);
    item.stock = Math.round((item.stock + (record.kind === 'Used' ? -record.quantity : record.quantity)) * 100) / 100;
    next.movements.unshift({ ...record, department: item.department, itemName: item.name });
  } else if (action.type === 'trip-delete' || action.type === 'trip-restore') {
    const trip = next.trips.find(i => i.id === record.id && i.date === record.date);
    if (!trip) throw new Error('Trip no longer exists for this date.');
    trip.deletedAt = action.type === 'trip-delete' ? record.updatedAt : null;
    trip.updatedAt = record.updatedAt;
    trip.updatedBy = record.staff;
  } else if (action.type === 'trip') {
    if (!String(record.room || '').trim() || !/^\d{2}:\d{2}$/.test(record.time) || !['Pick up', 'Drop off'].includes(record.direction)) throw new Error('Room, time, and pick/drop are required.');
    next.trips = [...next.trips.filter(i => i.id !== record.id), record];
  } else if (action.type === 'mileage') {
    record.start = number(record.start, 'Starting miles');
    record.end = record.end === '' ? '' : number(record.end, 'Ending miles');
    if (record.end !== '' && record.end < record.start) throw new Error('Ending miles cannot be below starting miles.');
    next.mileage = [...next.mileage.filter(i => !(i.date === record.date && i.vehicle === record.vehicle)), record];
  } else if (action.type === 'expense') {
    record.amount = number(record.amount, 'Amount', 0.01);
    if (!record.vendor?.trim() || !record.notes?.trim()) throw new Error('Vendor and purpose are required.');
    if (record.card && !/^\d{4}$/.test(record.card)) throw new Error('Enter only the last four card digits.');
    record.amount = Math.round(record.amount * 100) / 100;
    next.expenses = [...next.expenses.filter(i => i.id !== record.id), record];
  } else throw new Error('Unknown operation.');
  return next;
}
export function csv(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value ?? '');
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
  }).join(',')).join('\r\n');
}
export function download(name, content, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseInventory(text, extension) {
  let rows;
  if (extension === 'json') {
    rows = JSON.parse(text);
    if (!Array.isArray(rows)) throw new Error('JSON must contain an array of inventory items.');
  } else {
    const delimiter = extension === 'tsv' ? '\t' : ',';
    const table = []; let row = [], cell = '', quoted = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
      else if (!quoted && (c === delimiter || c === '\n')) { row.push(cell.replace(/\r$/, '')); cell = ''; if (c === '\n') { table.push(row); row = []; } }
      else cell += c;
    }
    if (quoted) throw new Error('Unclosed quote in file.');
    row.push(cell.replace(/\r$/, '')); table.push(row);
    const headers = table.shift().map(h => h.trim());
    if (!headers.includes('name') || !headers.includes('stock')) throw new Error('Required columns: name, stock. Download the template for all columns.');
    rows = table.filter(r => r.some(v => v.trim())).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
  }
  if (!rows.length || rows.length > 500) throw new Error('Import between 1 and 500 items at a time.');
  return rows.map((r, i) => {
    if (!r || typeof r !== 'object' || !String(r.name || '').trim()) throw new Error(`Row ${i + 1}: name is required.`);
    return { name: String(r.name).trim(), category: String(r.category || 'General'), stock: number(r.stock, `Row ${i + 1} stock`), minStock: number(r.minStock ?? 5, 'Minimum stock'), purchaseRate: number(r.purchaseRate ?? 0, 'Purchase rate'), staffRate: number(r.staffRate ?? 0, 'Staff rate'), guestRate: number(r.guestRate ?? 0, 'Guest rate'), image: '' };
  });
}
