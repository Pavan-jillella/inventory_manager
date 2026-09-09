import test from 'node:test';
import assert from 'node:assert/strict';
import schedule from '../functions/reportSchedule.js';
import { validateEmailSettings } from '../src/lib/emailSettings.js';

test('report is due at the configured local time and covers the previous day', () => {
  assert.deepEqual(schedule.reportSchedule(new Date('2026-09-09T10:59:00Z'), 'America/New_York', '07:00'), { due: false, reportDate: '2026-09-08' });
  assert.deepEqual(schedule.reportSchedule(new Date('2026-09-09T11:00:00Z'), 'America/New_York', '07:00'), { due: true, reportDate: '2026-09-08' });
});
test('report calendar handles daylight saving and year boundaries', () => {
  for (const [instant, day] of [['2026-03-08T11:00:00Z', '2026-03-07'], ['2026-11-01T12:00:00Z', '2026-10-31'], ['2027-01-01T12:00:00Z', '2026-12-31']]) {
    assert.deepEqual(schedule.reportSchedule(new Date(instant), 'America/New_York', '07:00'), { due: true, reportDate: day });
  }
  assert.equal(schedule.localDay('2026-09-09T02:00:00Z', 'America/New_York'), '2026-09-08');
});
test('report time and timezone reject invalid configuration', () => {
  assert.throws(() => schedule.reportSchedule(new Date(), 'America/New_York', '24:00'));
  assert.throws(() => validateEmailSettings({ timeZone: 'New York' }), /time zone/);
  assert.throws(() => validateEmailSettings({ scheduleTime: '25:30' }), /time/);
});
test('enabled reports need valid recipients with a bounded list', () => {
  assert.throws(() => validateEmailSettings({ enabled: true }), /recipient/);
  assert.throws(() => validateEmailSettings({ recipients: 'broken-email' }), /email/);
  assert.throws(() => validateEmailSettings({ recipients: Array(21).fill('test@example.com').join(',') }), /20/);
  assert.doesNotThrow(() => validateEmailSettings({ enabled: true, recipients: 'one@example.com, two@example.com', scheduleTime: '23:59' }));
});
