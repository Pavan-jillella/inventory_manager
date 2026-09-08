import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOperation, emptyOperations, parseInventory, csv } from '../src/lib/operations.js';
const supply = { id: 'item1', name: 'Milk', stock: 10, minStock: 2, unit: 'cartons', department: 'Breakfast', date: '2026-09-07' };
test('usage and restocking retain accurate stock and history', () => {
  const initial = applyOperation(emptyOperations(), { type: 'supply', record: supply });
  const used = applyOperation(initial, { type: 'movement', record: { id: 'm1', itemId: 'item1', kind: 'Used', quantity: 3 } });
  assert.equal(used.supplies[0].stock, 7); assert.equal(initial.supplies[0].stock, 10);
  assert.equal(used.movements[0].itemName, 'Milk');
  const received = applyOperation(used, { type: 'movement', record: { id: 'm2', itemId: 'item1', kind: 'Received', quantity: 5 } });
  assert.equal(received.supplies[0].stock, 12);
});
test('stock cannot go negative or accept invalid quantities', () => {
  const initial = applyOperation(emptyOperations(), { type: 'supply', record: supply });
  for (const quantity of [-1, 0, '', 'bad', Infinity, 11]) assert.throws(() => applyOperation(initial, { type: 'movement', record: { id: 'm', itemId: 'item1', kind: 'Used', quantity } }));
});
test('manual stock correction produces audit entry', () => {
  const initial = applyOperation(emptyOperations(), { type: 'supply', record: supply });
  const corrected = applyOperation(initial, { type: 'supply', record: { ...supply, stock: 8 } });
  assert.equal(corrected.movements[0].kind, 'Adjustment'); assert.equal(corrected.supplies[0].stock, 8);
});
test('mileage permits morning-only reading and rejects reversed odometer', () => {
  const record = { id: 'm', date: '2026-09-07', vehicle: 'Shuttle', start: 100, end: '' };
  const state = applyOperation(emptyOperations(), { type: 'mileage', record });
  assert.equal(state.mileage[0].end, '');
  assert.throws(() => applyOperation(state, { type: 'mileage', record: { ...record, end: 99 } }));
  const updated = applyOperation(state, { type: 'mileage', record: { ...record, end: 150 } });
  assert.equal(updated.mileage.length, 1); assert.equal(updated.mileage[0].end, 150);
});
test('expenses validate money and restrict card numbers', () => {
  const record = { id: 'e', vendor: 'Store', notes: 'Supplies', amount: '12.35', card: '1234' };
  assert.equal(applyOperation(emptyOperations(), { type: 'expense', record }).expenses[0].amount, 12.35);
  assert.throws(() => applyOperation(emptyOperations(), { type: 'expense', record: { ...record, card: '1234567890123456' } }));
  assert.throws(() => applyOperation(emptyOperations(), { type: 'expense', record: { ...record, amount: -1 } }));
});
test('CSV handles quotes, commas, newlines, BOM and zero minimum', () => {
  const rows = parseInventory('\uFEFFname,stock,minStock\r\n"Milk, whole",10,0\r\n"Fresh\nfruit",2,1', 'csv');
  assert.equal(rows.length, 2); assert.equal(rows[0].name, 'Milk, whole'); assert.equal(rows[0].minStock, 0); assert.equal(rows[1].name, 'Fresh\nfruit');
});
test('invalid imports fail before saving', () => {
  for (const input of ['name,stock\nMilk,-2', 'name,stock\nMilk,no', 'name,stock\n"Milk,2', 'foo,stock\nMilk,2']) assert.throws(() => parseInventory(input, 'csv'));
  assert.throws(() => parseInventory('{}', 'json')); assert.throws(() => parseInventory('[]', 'json'));
});
test('TSV and JSON imports normalize defaults', () => {
  assert.equal(parseInventory('name\tstock\nTowels\t20', 'tsv')[0].stock, 20);
  assert.equal(parseInventory('[{"name":"Towels","stock":20}]', 'json')[0].minStock, 5);
});
test('CSV export neutralizes spreadsheet formula injection', () => {
  assert.equal(csv([['=SUM(A1)', 'A "quote"']]), '"\'=SUM(A1)","A ""quote"""');
});
