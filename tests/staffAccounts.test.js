import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function backend({ role = 'Admin', failProfile = false } = {}) {
  const events = [];
  const auth = {
    createUser: async data => { events.push(['create', data]); return { uid: 'new-uid' }; },
    deleteUser: async uid => events.push(['rollback', uid]),
    updateUser: async (uid, data) => events.push(['updateAuth', uid, data]),
    revokeRefreshTokens: async uid => events.push(['revoke', uid]),
  };
  const db = { collection: () => ({ doc: uid => ({
    get: async () => ({ exists: true, data: () => ({ role }) }),
    set: async data => { if (failProfile) throw new Error('write failed'); events.push(['profile', uid, data]); },
    update: async data => events.push(['updateProfile', uid, data]),
    delete: async () => events.push(['deleteProfile', uid]),
  }) }) };
  const modules = {
    'firebase-admin/app': { initializeApp() {} },
    'firebase-admin/firestore': { getFirestore: () => db },
    'firebase-admin/auth': { getAuth: () => auth },
    'firebase-functions/v2/https': { onCall: fn => fn, HttpsError: class extends Error { constructor(code, message) { super(message); this.code = code; } } },
  };
  const context = { exports: {}, require: key => modules[key] };
  vm.runInNewContext(readFileSync(new URL('../functions-staff/index.js', import.meta.url), 'utf8'), context);
  return { call: data => context.exports.manageStaff({ auth: { uid: 'admin' }, data }), events };
}
const request = { action: 'create', name: 'Desk Staff', username: 'Front.Desk', password: 'example-test-password', role: 'Front Desk' };
test('username accounts link profile to Auth UID and never store the password in Firestore', async () => {
  const server = backend();
  const profile = await server.call(request);
  assert.equal(server.events[0][1].email, 'front.desk@staff.country-inn-suites.invalid');
  assert.equal(profile.id, 'new-uid');
  assert.equal(server.events[1][1], 'new-uid');
  assert.equal(profile.username, 'front.desk');
  assert.equal(Object.hasOwn(profile, 'password'), false);
});
test('existing email login format remains supported', async () => {
  const server = backend();
  assert.equal((await server.call({ ...request, username: 'Person@example.com' })).loginType, 'email');
  assert.equal(server.events[0][1].email, 'person@example.com');
});
test('failed profile creation rolls back only the newly created Auth account', async () => {
  const server = backend({ failProfile: true });
  await assert.rejects(server.call(request), /write failed/);
  assert.deepEqual(server.events[1], ['rollback', 'new-uid']);
});
test('front desk cannot create accounts and invalid roles/passwords are rejected', async () => {
  await assert.rejects(backend({ role: 'Front Desk' }).call(request), { code: 'permission-denied' });
  for (const invalid of [{ password: 'short' }, { role: 'Owner' }, { username: 'x' }]) {
    const server = backend();
    await assert.rejects(server.call({ ...request, ...invalid }), { code: 'invalid-argument' });
    assert.equal(server.events.length, 0);
  }
});
test('administrator password reset revokes existing sessions', async () => {
  const server = backend();
  await server.call({ action: 'rename', uid: 'staff', name: 'Staff', password: 'new-example-password' });
  assert.equal(server.events[0][0], 'updateAuth');
  assert.deepEqual(server.events[1], ['revoke', 'staff']);
});
test('administrator cannot remove their own account', async () => {
  const server = backend();
  await assert.rejects(server.call({ action: 'remove', uid: 'admin' }), { code: 'invalid-argument' });
  assert.equal(server.events.length, 0);
});
