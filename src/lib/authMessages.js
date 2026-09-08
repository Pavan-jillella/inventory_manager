export function staffAccessError(code) {
  return Object.assign(new Error('Staff access verification failed.'), { code });
}

export function signInMessage(error) {
  switch (error?.code) {
    case 'app/staff-profile-missing':
      return 'Your email and password were accepted, but this account is not linked to a hotel staff profile. The administrator must finish the staff account migration.';
    case 'app/staff-role-invalid':
      return 'This account does not have an active hotel staff role. Contact your administrator.';
    case 'app/auth-not-configured':
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Email sign-in is not configured for this website. Contact the administrator to finish Firebase Authentication setup.';
    case 'auth/invalid-email':
      return 'Enter your registered email address. Old username-only accounts must be migrated before they can sign in.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password was not recognized. If you previously signed in with a username, your administrator must first migrate that account.';
    case 'auth/user-disabled':
      return 'This account is disabled. Contact your administrator.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Wait a few minutes before trying again.';
    case 'auth/network-request-failed':
    case 'unavailable':
      return 'Unable to reach the sign-in service. Check your internet connection and try again.';
    case 'permission-denied':
      return 'Your hotel staff access could not be verified. The administrator needs to check the staff profile and database access rules.';
    default:
      return 'Sign-in could not be completed. Please try again or contact your administrator.';
  }
}
