import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import reportSchedule from '../functions/reportSchedule.js';

function backend({ enabled = true, failSend = false, partial = false } = {}) {
  let claim;
  const messages = [];
  const settings = { emailReports: { enabled, recipients: 'report@example.com', scheduleTime: '00:00', timeZone: 'UTC' } };
  const delivery = { update: async value => { claim = { ...claim, ...value }; } };
  const settingsRef = { get: async () => ({ exists: true, data: () => settings }), set: async value => Object.assign(settings.emailReports, value.emailReports) };
  const db = {
    collection: name => name === 'settings' ? { doc: () => settingsRef }
      : name === 'report_deliveries' ? { doc: () => delivery }
      : { where() { return this; }, get: async () => ({ docs: [] }) },
    runTransaction: async fn => fn({ get: async () => ({ exists: Boolean(claim) }), set: (_ref, value) => { claim = value; } }),
  };
  const modules = {
    'firebase-admin/app': { initializeApp() {} },
    'firebase-admin/firestore': { getFirestore: () => db },
    'firebase-functions/v2/scheduler': { onSchedule: (_options, fn) => fn },
    'firebase-functions/logger': { info() {}, error() {} },
    'firebase-functions/params': { defineSecret: name => ({ value: () => name.endsWith('PORT') ? '587' : 'test-value' }) },
    './reportSchedule': reportSchedule,
    nodemailer: { createTransport: () => ({ sendMail: async value => {
      messages.push(value);
      if (failSend) throw new Error('SMTP unavailable');
      return { rejected: partial ? ['report@example.com'] : [] };
    } }) },
  };
  const context = { exports: {}, require: name => modules[name] };
  vm.runInNewContext(readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8'), context);
  return { run: context.exports.sendDailyShiftReport, messages, get status() { return claim?.status; } };
}
test('scheduled reports send once per business date even with repeated invocations', async () => {
  const server = backend();
  await server.run(); await server.run();
  assert.equal(server.messages.length, 1);
  assert.equal(server.status, 'sent');
  assert.equal(server.messages[0].to, 'report@example.com');
  assert.equal(server.messages[0].attachments.length, 1);
});
test('disabled reports do not send email or claim a date', async () => {
  const server = backend({ enabled: false });
  await server.run();
  assert.equal(server.messages.length, 0);
  assert.equal(server.status, undefined);
});
test('failed delivery is visible and is not automatically duplicated', async () => {
  const server = backend({ failSend: true });
  await assert.rejects(server.run(), /SMTP unavailable/);
  await server.run();
  assert.equal(server.status, 'needs-review');
  assert.equal(server.messages.length, 1);
});
test('partially rejected delivery is not reported as fully sent', async () => {
  const server = backend({ partial: true });
  await assert.rejects(server.run(), /recipients/);
  assert.equal(server.status, 'needs-review');
});
