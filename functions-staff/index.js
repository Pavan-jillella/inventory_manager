const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
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
  const { action, name, email, password, role, uid } = request.data || {};
  if (action === 'rename') {
    if (typeof uid !== 'string' || typeof name !== 'string' || !name.trim() || name.length > 100) throw new HttpsError('invalid-argument', 'A staff profile and name are required.');
    const profile = db.collection('users').doc(uid);
    if (!(await profile.get()).exists) throw new HttpsError('not-found', 'Staff profile not found.');
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 12) throw new HttpsError('invalid-argument', 'Passwords must contain at least 12 characters.');
      await admin.auth().updateUser(uid, { password });
      await admin.auth().revokeRefreshTokens(uid);
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
    const user = await admin.auth().createUser({ email: authEmail, password, displayName: name.trim() });
    const profile = { id: user.uid, name: name.trim(), username: identifier, loginType: isEmail ? 'email' : 'username', role };
    try { await db.collection('users').doc(user.uid).set(profile); }
    catch (error) { await admin.auth().deleteUser(user.uid); throw error; }
    return profile;
  }
  if (action === 'remove') {
    if (typeof uid !== 'string' || uid === request.auth.uid) throw new HttpsError('invalid-argument', 'You cannot remove your own account.');
    await admin.auth().updateUser(uid, { disabled: true });
    await admin.auth().revokeRefreshTokens(uid);
    await db.collection('users').doc(uid).delete();
    return { removed: true };
  }
  throw new HttpsError('invalid-argument', 'Unknown staff action.');
});
