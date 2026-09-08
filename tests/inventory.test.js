import test from 'node:test';
import assert from 'node:assert/strict';
import { planIssue, planLogChange } from '../src/lib/inventory.js';

const item = { id: 'one', name: 'Milk', category: 'Drinks', stock: 4, guestRate: 0.1, staffRate: 0.05, purchaseRate: 0.02 };
const details = { rateType: 'guest', paymentMethod: 'card' };
const cart = [{ item, quantity: 3, logId: 'log-one' }];
test('issue uses current inventory prices and exact monetary totals', () => {
  const plan = planIssue([item], cart, details);
  assert.equal(plan.updatedItems[0].stock, 1);
  assert.equal(plan.newLogs[0].totalAmount, 0.3);
  assert.equal(item.stock, 4);
  assert.equal(planIssue([{ ...item, guestRate: 2 }], cart, details).newLogs[0].totalAmount, 6);
});
test('invalid and duplicate carts cannot deduct stock', () => {
  for (const quantity of [0, -1, 1.1, 5, NaN]) assert.throws(() => planIssue([item], [{ item, quantity }], details));
  assert.throws(() => planIssue([item], [cart[0], cart[0]], details));
  assert.throws(() => planIssue([], cart, details));
  assert.throws(() => planIssue([item], [], details));
});
test('free amenities retain cost but do not generate revenue', () => {
  const plan = planIssue([item], [{ ...cart[0], isFree: true }], details);
  assert.equal(plan.newLogs[0].totalAmount, 0);
  assert.equal(plan.newLogs[0].purchaseCost, 0.06);
  assert.equal(plan.newLogs[0].paymentMethod, 'Amenity');
});
test('activity edit and deletion restore the correct stock', () => {
  const plan = planIssue([item], cart, details);
  const edited = planLogChange(plan.newLogs[0], plan.updatedItems[0], { quantity: 2 });
  assert.equal(edited.updatedItem.stock, 2);
  assert.equal(edited.updatedLog.totalAmount, 0.2);
  const removed = planLogChange(edited.updatedLog, edited.updatedItem, null);
  assert.equal(removed.updatedItem.stock, 4);
  assert.equal(removed.updatedLog, null);
});
test('activity edits reject unavailable stock and forged prices', () => {
  const plan = planIssue([item], cart, details);
  assert.throws(() => planLogChange(plan.newLogs[0], plan.updatedItems[0], { quantity: 5 }));
  assert.throws(() => planLogChange(plan.newLogs[0], null, { quantity: 1 }));
  const changed = planLogChange(plan.newLogs[0], plan.updatedItems[0], { unitRate: 99, itemId: 'other' });
  assert.equal(changed.updatedLog.unitRate, 0.1);
  assert.equal(changed.updatedLog.itemId, 'one');
});
