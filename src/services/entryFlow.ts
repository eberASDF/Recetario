export type EntryMode = 'loading' | 'welcome' | 'verify' | 'biometric' | 'app';

export interface EntryState {
  mode: EntryMode;
  isAuthenticated: boolean;
  hasAuthenticatedSession: boolean;
}

export type EntryAction =
  | { type: 'bootstrap'; hasSession: boolean }
  | { type: 'guest' | 'welcome' | 'verificationRequired' | 'authenticated' | 'biometricSuccess' | 'signOut' };

export function transitionEntry(state: EntryState, action: EntryAction): EntryState {
  switch (action.type) {
    case 'bootstrap':
      return { mode: action.hasSession ? 'biometric' : 'welcome', isAuthenticated: false, hasAuthenticatedSession: action.hasSession };
    case 'guest':
      return { mode: 'app', isAuthenticated: false, hasAuthenticatedSession: false };
    case 'welcome':
      return { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: state.hasAuthenticatedSession };
    case 'verificationRequired':
      return { mode: 'verify', isAuthenticated: false, hasAuthenticatedSession: false };
    case 'signOut':
      return { mode: 'welcome', isAuthenticated: false, hasAuthenticatedSession: false };
    case 'authenticated':
      return { mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true };
    case 'biometricSuccess':
      return (state.mode === 'biometric' || state.mode === 'welcome') && state.hasAuthenticatedSession
        ? { mode: 'app', isAuthenticated: true, hasAuthenticatedSession: true }
        : state;
  }
}
