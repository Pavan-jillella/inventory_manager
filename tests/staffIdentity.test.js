import test from 'node:test';
import assert from 'node:assert/strict';
import { staffLoginEmail } from '../src/lib/staffIdentity.js';
test('username sign-in is case insensitive and preserves existing email accounts', () => {
  assert.equal(staffLoginEmail(' FrontDesk1 '), 'frontdesk1@staff.country-inn-suites.invalid');
  assert.equal(staffLoginEmail(' Owner@Example.com '), 'owner@example.com');
  for (const invalid of ['', 'ab', 'two words', '../staff', 'x'.repeat(33)]) assert.throws(() => staffLoginEmail(invalid));
});
