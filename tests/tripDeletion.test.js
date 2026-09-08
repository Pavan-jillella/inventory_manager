import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOperation, emptyOperations } from '../src/lib/operations.js';

test('deleting a completed trip retains its details and can be restored after persistence', () => {
  const state = emptyOperations();
  state.trips.push({ id: 'trip1', date: '2026-09-08', room: '101', time: '08:30', status: 'Completed' });
  const record = { id: 'trip1', date: '2026-09-08', updatedAt: '2026-09-08T12:00:00Z', staff: 'Tester' };
  const deleted = applyOperation(state, { type: 'trip-delete', record });
  assert.equal(deleted.trips.filter(t => !t.deletedAt).length, 0);
  assert.equal(state.trips[0].deletedAt, undefined);
  const restored = applyOperation(JSON.parse(JSON.stringify(deleted)), { type: 'trip-restore', record });
  assert.equal(restored.trips[0].deletedAt, null);
  assert.equal(restored.trips[0].room, '101');
  assert.equal(restored.trips[0].status, 'Completed');
});

test('trip deletion cannot modify another business date or a missing record', () => {
  const state = emptyOperations();
  state.trips.push({ id: 'trip1', date: '2026-09-08' });
  assert.throws(() => applyOperation(state, { type: 'trip-delete', record: { id: 'trip1', date: '2026-09-09' } }), /no longer exists/);
  assert.throws(() => applyOperation(state, { type: 'trip-delete', record: { id: 'missing', date: '2026-09-08' } }), /no longer exists/);
});
