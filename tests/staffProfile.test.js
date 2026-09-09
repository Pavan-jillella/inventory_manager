import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function backend(role = 'Front Desk') {
  const writes = [];
  const context = { exports: {}, require(name) {
    if (name === 'firebase-admin/app') return { initializeApp() {} };
    if (name === 'firebase-admin/firestore') return { getFirestore: () => ({ collection: () => ({ doc: id => ({ get: async () => ({ exists: true, data: () => ({ role }), ref: { update: async value => writes.push({ id, ...value }) } }), update: async value => writes.push({ id, ...value }) }) }) }) };
    if (name === 'firebase-admin/auth') return { getAuth() { throw new Error('Unexpected credential change'); } };
    return { onCall: fn => fn, HttpsError: class extends Error { constructor(code, message) { super(message); this.code = code; } } };
  } };
  vm.runInNewContext(readFileSync(new URL('../functions-staff/index.js', import.meta.url), 'utf8'), context);
  return { call: context.exports.manageStaff, writes };
}
test('staff can edit only their own name without changing role or target account', async () => {
  const { call, writes } = backend();
  await call({ auth: { uid: 'self' }, data: { action: 'updateProfile', name: ' New Name ', uid: 'other', role: 'Admin' } });
  assert.equal(JSON.stringify(writes), JSON.stringify([{ id: 'self', name: 'New Name' }]));
});
test('unauthenticated and non-staff profile writes are rejected', async () => {
  await assert.rejects(backend().call({ data: { action: 'updateProfile', name: 'Name' } }), { code: 'unauthenticated' });
  await assert.rejects(backend('Guest').call({ auth: { uid: 'self' }, data: { action: 'updateProfile', name: 'Name' } }), { code: 'permission-denied' });
});
test('only administrators can rename other staff, and empty names are rejected', async () => {
  const request = { auth: { uid: 'self' }, data: { action: 'rename', uid: 'other', name: 'Updated' } };
  await assert.rejects(backend().call(request), { code: 'permission-denied' });
  const admin = backend('Admin');
  await admin.call(request);
  assert.equal(admin.writes[0].id, 'other');
  await assert.rejects(admin.call({ ...request, data: { ...request.data, name: ' ' } }), { code: 'invalid-argument' });
});
