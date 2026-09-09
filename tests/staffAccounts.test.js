import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { staffRecord } from '../src/lib/staffRecords.js';

function backend({ role = 'Admin', failProfile = false, authError, revokeError, profileExists = true } = {}) {
  const events = [];
  const auth = {
    createUser: async data => { events.push(['create', data]); return { uid: 'new-uid' }; },
    deleteUser: async uid => events.push(['rollback', uid]),
    updateUser: async (uid, data) => {
      events.push(['updateAuth', uid, data]);
      if (authError) throw Object.assign(new Error('Auth failed'), { code: authError });
    },
    revokeRefreshTokens: async uid => {
      events.push(['revoke', uid]);
      if (revokeError) throw Object.assign(new Error('Revoke failed'), { code: revokeError });
    },
  };
  const db = { collection: () => ({ doc: uid => ({
    get: async () => ({ exists: uid === 'admin' || profileExists, data: () => ({ role }) }),
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
test('staff reads use the real document ID and exclude legacy stored passwords', () => {
  assert.deepEqual(staffRecord('actual-uid', { id: 123, name: 'Old staff', username: 'desk', role: 'Front Desk', password: 'obsolete' }), { id: 'actual-uid', name: 'Old staff', username: 'desk', role: 'Front Desk' });
});
test('older numeric profile IDs can be renamed without creating or changing credentials', async () => {
  const server = backend();
  await server.call({ action: 'rename', uid: 123, name: 'Updated name' });
  assert.equal(server.events.length, 1);
  assert.equal(server.events[0][0], 'updateProfile');
  assert.equal(server.events[0][1], '123');
});
test('legacy profile removal succeeds when its exact Auth UID does not exist', async () => {
  const server = backend({ authError: 'auth/user-not-found' });
  await server.call({ action: 'remove', uid: 123 });
  assert.equal(server.events[0][1], '123');
  assert.deepEqual(server.events[1], ['deleteProfile', '123']);
});
test('linked staff removal disables and revokes access before removing only its profile', async () => {
  const server = backend();
  await server.call({ action: 'remove', uid: 'staff' });
  assert.equal(server.events[0][2].disabled, true);
  assert.deepEqual(server.events.slice(1), [['revoke', 'staff'], ['deleteProfile', 'staff']]);
});
test('permission or session-revocation failures never remove the staff profile', async () => {
  for (const options of [{ authError: 'auth/insufficient-permission' }, { revokeError: 'auth/internal-error' }]) {
    const server = backend(options);
    await assert.rejects(server.call({ action: 'remove', uid: 'staff' }));
    assert.equal(server.events.some(e => e[0] === 'deleteProfile'), false);
  }
});
test('legacy password reset explains missing account without changing profile or provisioning access', async () => {
  const server = backend({ authError: 'auth/user-not-found' });
  await assert.rejects(server.call({ action: 'rename', uid: 123, name: 'Name', password: 'example-password' }), { code: 'failed-precondition' });
  assert.equal(server.events.length, 1);
  assert.equal(server.events[0][0], 'updateAuth');
});
test('front desk cannot edit or remove staff, and invalid IDs are rejected', async () => {
  for (const action of ['rename', 'remove']) {
    await assert.rejects(backend({ role: 'Front Desk' }).call({ action, uid: 'staff', name: 'Name' }), { code: 'permission-denied' });
    for (const uid of [null, {}, 'other/path', '', -1]) await assert.rejects(backend().call({ action, uid, name: 'Name' }), { code: 'invalid-argument' });
  }
});
test('missing target profile cannot disable an unrelated Auth account', async () => {
  const server = backend({ profileExists: false });
  await assert.rejects(server.call({ action: 'remove', uid: 'missing' }), { code: 'not-found' });
  assert.equal(server.events.length, 0);
});
