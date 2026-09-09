import test from 'node:test';
import assert from 'node:assert/strict';
import { dateRange, shiftDate, stockEstimate, weeklyMileage, comparison, sumMoney } from '../src/lib/analytics.js';
import { applyOperation, emptyOperations } from '../src/lib/operations.js';
import { productChange, productPatch } from '../src/lib/productHistory.js';
import { validateReceipt, validateReceiptRecord } from '../src/lib/receiptValidation.js';

test('date ranges compare equal calendar periods across month and leap boundaries', () => {
  assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
  assert.deepEqual(dateRange('7', '', '', '2026-01-03'), { from: '2025-12-28', to: '2026-01-03', days: 7, previousFrom: '2025-12-21', previousTo: '2025-12-27' });
  assert.equal(dateRange('custom', '2026-02-30', '2026-03-01', '2026-09-09'), null);
  assert.equal(dateRange('custom', '2026-09-09', '2026-09-08', '2026-09-09'), null);
  assert.equal(dateRange('custom', '2026-09-09', '2026-09-10', '2026-09-09'), null);
});
test('restocking refuses sparse, future, unrelated and old usage', () => {
  const item = { id: 'a', stock: 20 };
  const log = (date, quantity = 10, itemId = 'a') => ({ timestamp: `${date}T12:00:00`, quantity, itemId });
  assert.equal(stockEstimate(item, [log('2026-09-09')], '2026-09-09'), null);
  const rows = [log('2026-09-01'), log('2026-09-03'), log('2026-09-09'), log('2026-09-10', 100), log('2026-07-01', 100), log('2026-09-02', 100, 'other')];
  assert.equal(stockEstimate(item, rows, '2026-09-09').days, 6);
  assert.equal(stockEstimate({ ...item, stock: 0 }, rows, '2026-09-09').days, 0);
});
test('weekly mileage distinguishes missing, open and genuine zero-mile days', () => {
  const result = weeklyMileage([{ mileage: [{ date: '2026-09-07', start: 100, end: '' }, { date: '2026-09-08', start: 100, end: 100 }, { date: '2026-09-09', start: 100, end: 120 }, { date: '2026-09-09', start: 50, end: 55 }] }], '2026-09-09');
  assert.equal(result[0].miles, null); assert.equal(result[4].miles, null); assert.equal(result[4].incomplete, 1); assert.equal(result[5].miles, 0); assert.equal(result[6].miles, 25);
});
test('served and wasted quantities each deduct stock and retain units', () => {
  const initial = { ...emptyOperations(), supplies: [{ id: 'milk', name: 'Milk', department: 'Breakfast', stock: 10, unit: 'cartons' }] };
  const served = applyOperation(initial, { type: 'movement', record: { id: 's', itemId: 'milk', quantity: 4, kind: 'Served' } });
  const wasted = applyOperation(served, { type: 'movement', record: { id: 'w', itemId: 'milk', quantity: 2, kind: 'Wasted' } });
  assert.equal(wasted.supplies[0].stock, 4); assert.equal(wasted.movements[0].unit, 'cartons'); assert.equal(initial.supplies[0].stock, 10);
  assert.throws(() => applyOperation(wasted, { type: 'movement', record: { id: 'bad', itemId: 'milk', quantity: 5, kind: 'Wasted' } }));
});
test('guest counts replace only the chosen date and reject fractions', () => {
  let state = emptyOperations();
  for (const [date, count] of [['2026-09-08', 20], ['2026-09-09', 30], ['2026-09-09', 40]]) state = applyOperation(state, { type: 'breakfast-guests', record: { id: date, date, count } });
  assert.equal(state.breakfastGuests.length, 2); assert.equal(state.breakfastGuests[1].count, 40);
  assert.throws(() => applyOperation(state, { type: 'breakfast-guests', record: { id: 'bad', date: '2026-09-09', count: 2.5 } }));
});
test('product history captures actual changed fields without full image duplication', () => {
  const entry = productChange({ id: 'a', stock: 10, name: 'Milk' }, { stock: 8, name: 'Milk' }, { id: 'admin', name: 'Admin' }, 'event', '2026-09-09T12:00:00Z');
  assert.deepEqual(entry.changes, [{ field: 'stock', before: 10, after: 8 }]); assert.equal(entry.itemId, 'a'); assert.equal(entry.staffId, 'admin');
});
test('money sums are rounded in cents and zero baselines do not produce infinity', () => {
  assert.equal(sumMoney([{ amount: 0.1 }, { amount: 0.2 }], 'amount'), 0.3);
  assert.equal(comparison(20, 0), 'No previous activity to compare');
  assert.equal(comparison(12, 10), '+20.0% vs previous period');
});
test('product editing preserves concurrent stock unless explicitly corrected from a fresh value', () => {
  assert.deepEqual(productPatch({ stock: 8 }, { name: 'Milk', stock: 10 }, { stock: 10 }), { name: 'Milk' });
  assert.throws(() => productPatch({ stock: 8 }, { stock: 12 }, { stock: 10 }));
  assert.deepEqual(productPatch({ stock: 8 }, { stock: 12 }, { stock: 8 }), { stock: 12 });
});
test('receipts reject executable files, oversized uploads and invalid stored paths', () => {
  assert.doesNotThrow(() => validateReceipt({ type: 'application/pdf', size: 1024 }));
  for (const file of [{ type: 'text/html', size: 100 }, { type: 'image/png', size: 6 * 1024 * 1024 }, { type: 'image/png', size: 0 }]) assert.throws(() => validateReceipt(file));
  assert.throws(() => validateReceiptRecord({ path: 'products/x', name: 'receipt.pdf', type: 'application/pdf' }));
  assert.throws(() => validateReceiptRecord({ path: 'https://example.com/receipt', name: 'receipt.pdf', type: 'application/pdf' }));
});
