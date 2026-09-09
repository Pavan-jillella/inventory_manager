const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
initializeApp();
const db = getFirestore();
// Staff credentials stay in Firebase Authentication, never in Firestore.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
exports.manageStaff = onCall(async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  const caller = await db.collection('users').doc(request.auth.uid).get();
  if (request.data?.action === 'updateProfile') {
    if (!['Admin', 'Front Desk'].includes(caller.data()?.role)) throw new HttpsError('permission-denied', 'Staff access required.');
    const name = String(request.data.name || '').trim();
    if (!name || name.length > 100) throw new HttpsError('invalid-argument', 'Enter a name between 1 and 100 characters.');
    await caller.ref.update({ name });
    return { name };
  }
  if (caller.data()?.role !== 'Admin') throw new HttpsError('permission-denied', 'Administrator access required.');
  const { action, name, email, password, role } = request.data || {};
  const rawUid = request.data?.uid;
  const uid = typeof rawUid === 'string' ? rawUid : Number.isSafeInteger(rawUid) && rawUid >= 0 ? String(rawUid) : '';
  if (['rename', 'remove'].includes(action) && (!uid || uid.length > 128 || uid.includes('/') || ['.', '..'].includes(uid))) throw new HttpsError('invalid-argument', 'Select a valid staff profile.');
  if (action === 'rename') {
    if (typeof uid !== 'string' || typeof name !== 'string' || !name.trim() || name.length > 100) throw new HttpsError('invalid-argument', 'A staff profile and name are required.');
    const profile = db.collection('users').doc(uid);
    if (!(await profile.get()).exists) throw new HttpsError('not-found', 'Staff profile not found.');
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 12) throw new HttpsError('invalid-argument', 'Passwords must contain at least 12 characters.');
      try {
        await getAuth().updateUser(uid, { password });
        await getAuth().revokeRefreshTokens(uid);
      } catch (error) {
        if (error.code === 'auth/user-not-found') throw new HttpsError('failed-precondition', 'This older profile has no linked sign-in account. Leave the password blank to edit its name, or use Add Staff to create a sign-in account.');
        throw error;
      }
    }
    await profile.update({ name: name.trim() });
    return { name: name.trim() };
  }
  if (action === 'create') {
    const identifier = String(request.data.username || email || '').trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) && !identifier.endsWith('.invalid');
    const isUsername = /^[a-z0-9][a-z0-9._-]{2,31}$/.test(identifier);
    if (typeof name !== 'string' || !name.trim() || name.length > 100 || (!isEmail && !isUsername) || typeof password !== 'string' || password.length < 12 || !['Admin', 'Front Desk'].includes(role)) throw new HttpsError('invalid-argument', 'Provide a name, valid username or email, password of at least 12 characters, and staff role.');
    const authEmail = isEmail ? identifier : `${identifier}@staff.country-inn-suites.invalid`;
    const user = await getAuth().createUser({ email: authEmail, password, displayName: name.trim() });
    const profile = { id: user.uid, name: name.trim(), username: identifier, loginType: isEmail ? 'email' : 'username', role };
    try { await db.collection('users').doc(user.uid).set(profile); }
    catch (error) { await getAuth().deleteUser(user.uid); throw error; }
    return profile;
  }
  if (action === 'remove') {
    if (uid === request.auth.uid) throw new HttpsError('invalid-argument', 'You cannot remove your own account.');
    const profile = db.collection('users').doc(uid);
    if (!(await profile.get()).exists) throw new HttpsError('not-found', 'Staff profile no longer exists. Refresh the page.');
    try {
      await getAuth().updateUser(uid, { disabled: true });
      await getAuth().revokeRefreshTokens(uid);
    } catch (error) {
      // Legacy profiles predate Authentication. Never match by email: a duplicate
      // profile may share an email with another person's active account.
      if (error.code !== 'auth/user-not-found') throw error;
    }
    await profile.delete();
    return { removed: true };
  }
  throw new HttpsError('invalid-argument', 'Unknown staff action.');
});
