import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';

export function Profile() {
  const { currentUser, updateProfile } = useAppContext();
  const [name, setName] = useState(currentUser.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function perform(action, success) {
    if (busy) return;
    setBusy(true); setMessage(''); setError('');
    try { await action(); setMessage(success); }
    catch (e) { setError(e.code ? 'Unable to update your account. Please try again or contact your administrator.' : e.message); }
    finally { setBusy(false); }
  }
  return <div className="suite-page profile-page"><header className="app-header"><div><p className="suite-eyebrow">YOUR ACCOUNT</p><h1>My profile</h1><p className="text-secondary">Keep your name and sign-in details up to date.</p></div></header><div className="suite-split"><section className="suite-panel"><h2>Personal details</h2><form className="ops-form" onSubmit={e => { e.preventDefault(); perform(() => updateProfile(name), 'Your profile has been saved.'); }}><label className="ops-field"><span>Display name</span><input value={name} onChange={e => setName(e.target.value)} required maxLength={100} /></label><label className="ops-field"><span>Sign-in account</span><input value={currentUser.username || ''} readOnly /></label><p className="text-secondary">Access level: {currentUser.role}. Contact your administrator to change your sign-in account.</p><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></form></section><section className="suite-panel"><h2>Account security</h2><p className="text-secondary">{currentUser.loginType === 'username' ? 'For a username account, ask an administrator to reset your password from Staff → Edit account.' : 'Send a secure password reset link to your sign-in email address.'}</p><button className="btn btn-outline" disabled={busy || !auth || currentUser.loginType === 'username'} onClick={() => perform(() => sendPasswordResetEmail(auth, currentUser.username), 'Password reset email sent. Check your inbox.')}>Send password reset email</button>{!auth && <p className="text-secondary">Password reset is available with Firebase sign-in.</p>}</section></div>{error && <p role="alert" className="ops-error">{error}</p>}{message && <p role="status" className="suite-message">{message}</p>}</div>;
}
