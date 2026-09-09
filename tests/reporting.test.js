import test from 'node:test';
import assert from 'node:assert/strict';
import { inRecentDays } from '../src/lib/reporting.js';
test('reporting includes full local calendar days and excludes future and invalid dates', () => {
  const now = new Date(2026, 8, 8, 12);
  assert.equal(inRecentDays(new Date(2026, 8, 2, 0), 7, now), true);
  assert.equal(inRecentDays(new Date(2026, 8, 1, 23, 59), 7, now), false);
  assert.equal(inRecentDays(new Date(2026, 8, 8, 13), 7, now), false);
  assert.equal(inRecentDays('invalid', 7, now), false);
});
