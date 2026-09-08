import test from 'node:test';
import assert from 'node:assert/strict';
import { signInMessage, staffAccessError } from '../src/lib/authMessages.js';

test('successful authentication with an unlinked profile identifies the migration', () => {
  const message = signInMessage(staffAccessError('app/staff-profile-missing'));
  assert.match(message, /accepted/);
  assert.match(message, /migration/);
});
test('credential failures do not disclose whether an email is registered', () => {
  assert.equal(signInMessage({ code: 'auth/user-not-found' }), signInMessage({ code: 'auth/wrong-password' }));
});
test('network and access-rule errors do not blame the password', () => {
  assert.match(signInMessage({ code: 'auth/network-request-failed' }), /internet connection/);
  assert.match(signInMessage({ code: 'permission-denied' }), /database access rules/);
});
test('unexpected exceptions cannot expose internal messages or credentials', () => {
  assert.doesNotMatch(signInMessage(new Error('secret-backend-value')), /secret-backend-value/);
});
