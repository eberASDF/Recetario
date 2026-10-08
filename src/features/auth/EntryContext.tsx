import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { authService, biometricService, profileService } from '@/services/container';
import { transitionEntry, type EntryState } from '@/services/entryFlow';
import type { BiometricOutcome } from '@/services/BiometricService';
import type { UserProfile } from '@/types';

interface EntryContextValue extends EntryState {
  profile: UserProfile | null;
  verificationEmail: string | null;
  verificationNotice: 'sent' | 'send_failed' | 'unverified' | 'already_verified';
  verificationCooldownUntil: number;
  saveProfilePhoto(uri: string): Promise<void>;
  enterGuest(): Promise<void>;
  showWelcome(): void;
  register(email: string, password: string, username: string): Promise<void>;
  signIn(email: string, password: string): Promise<'verified' | 'unverified'>;
  resendVerification(password: string): Promise<'sent' | 'already_verified'>;
  unlockWithBiometrics(): Promise<BiometricOutcome>;
  signOut(): Promise<void>;
}

const EntryContext = createContext<EntryContextValue | null>(null);

export function EntryProvider({ children }: PropsWithChildren) {
  const [entry, setEntry] = useState<EntryState>({ mode: 'loading', isAuthenticated: false, hasAuthenticatedSession: false });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<EntryContextValue['verificationNotice']>('unverified');
  const [verificationCooldownUntil, setVerificationCooldownUntil] = useState(0);
  const authAction = useRef(false);
  const authRevision = useRef(0);
  const unlockedUid = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = authService.observe((identity) => {
      if (!active) return;
      const revision = ++authRevision.current;
      if (authAction.current) return;
      if (!identity) {
        unlockedUid.current = null;
        setProfile(null);
        setEntry((current) => current.mode === 'verify' || (current.mode === 'app' && !current.isAuthenticated)
          ? current
          : transitionEntry(current, current.mode === 'loading' ? { type: 'bootstrap', hasSession: false } : { type: 'signOut' }));
        return;
      }
      if (identity.status === 'unverified') {
        unlockedUid.current = null;
        setProfile(null);
        setVerificationEmail(identity.email);
        setVerificationNotice('unverified');
        setEntry((current) => transitionEntry(current, { type: 'verificationRequired' }));
        return;
      }
      profileService.getProfile()
        .then((nextProfile) => {
          if (!active || revision !== authRevision.current || authAction.current) return;
          const keepUnlocked = Boolean(nextProfile && unlockedUid.current === identity.uid);
          if (!keepUnlocked) unlockedUid.current = null;
          setProfile(nextProfile);
          setEntry((current) => keepUnlocked && current.mode === 'app' && current.isAuthenticated
            ? current
            : transitionEntry(current, { type: 'bootstrap', hasSession: Boolean(nextProfile) }));
        })
        .catch(() => {
          if (!active || revision !== authRevision.current || authAction.current) return;
          unlockedUid.current = null;
          setProfile(null);
          setEntry((current) => transitionEntry(current, { type: 'bootstrap', hasSession: false }));
        });
    }, () => {
      if (active && !authAction.current) setEntry((current) => current.mode === 'verify' ? current : transitionEntry(current, { type: 'bootstrap', hasSession: false }));
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  const enterGuest = useCallback(async () => {
    if (authAction.current) return;
    authAction.current = true;
    authRevision.current += 1;
    try {
      if (authService.currentUid()) await authService.signOut();
      unlockedUid.current = null;
      setProfile(null);
      setEntry((current) => transitionEntry(current, { type: 'guest' }));
    } finally {
      authAction.current = false;
    }
  }, []);
  const showWelcome = useCallback(() => {
    setVerificationEmail(null);
    setEntry((current) => transitionEntry(current, { type: 'welcome' }));
  }, []);
  const register = useCallback(async (email: string, password: string, username: string) => {
    if (authAction.current) throw new Error('auth-busy');
    authAction.current = true;
    authRevision.current += 1;
    try {
      const result = await authService.register(email, password, username);
      unlockedUid.current = null;
      setProfile(null);
      setVerificationEmail(email.trim().toLowerCase());
      setVerificationNotice(result.verificationEmailSent ? 'sent' : 'send_failed');
      setVerificationCooldownUntil(result.verificationEmailSent ? Date.now() + 45_000 : 0);
      setEntry((current) => transitionEntry(current, { type: 'verificationRequired' }));
    } catch (error) {
      if (authService.currentUid()) await authService.signOut().catch(() => undefined);
      throw error;
    } finally {
      authAction.current = false;
    }
  }, []);
  const signIn = useCallback(async (email: string, password: string): Promise<'verified' | 'unverified'> => {
    if (authAction.current) throw new Error('auth-busy');
    authAction.current = true;
    authRevision.current += 1;
    try {
      const result = await authService.signIn(email, password);
      if (result.status === 'unverified') {
        unlockedUid.current = null;
        setProfile(null);
        setVerificationEmail(result.email);
        setVerificationNotice('unverified');
        setEntry((current) => transitionEntry(current, { type: 'verificationRequired' }));
        return 'unverified';
      }
      const nextProfile = await profileService.getProfile();
      if (!nextProfile) throw new Error('profile-missing');
      unlockedUid.current = result.uid;
      setVerificationEmail(null);
      setProfile(nextProfile);
      setEntry((current) => transitionEntry(current, { type: 'authenticated' }));
      return 'verified';
    } catch (error) {
      if (authService.currentUid()) await authService.signOut().catch(() => undefined);
      throw error;
    } finally {
      authAction.current = false;
    }
  }, []);
  const resendVerification = useCallback(async (password: string) => {
    if (!verificationEmail) throw new Error('verification-email-missing');
    if (Date.now() < verificationCooldownUntil) throw new Error('verification-cooldown');
    if (authAction.current) throw new Error('auth-busy');
    authAction.current = true;
    authRevision.current += 1;
    try {
      const result = await authService.resendVerification(verificationEmail, password);
      setVerificationNotice(result === 'sent' ? 'sent' : 'already_verified');
      if (result === 'sent') setVerificationCooldownUntil(Date.now() + 45_000);
      return result;
    } catch (error) {
      if (authService.currentUid()) await authService.signOut().catch(() => undefined);
      throw error;
    } finally {
      authAction.current = false;
    }
  }, [verificationEmail, verificationCooldownUntil]);
  const saveProfilePhoto = useCallback(async (uri: string) => {
    const nextProfile = await profileService.savePhoto(uri);
    setProfile(nextProfile);
  }, []);
  const unlockWithBiometrics = useCallback(async (): Promise<BiometricOutcome> => {
    if (!authService.currentUid() || !profile || !entry.hasAuthenticatedSession) return 'error';
    const verification = await authService.checkCurrentVerification().catch(() => null);
    if (verification?.status !== 'verified' || verification.uid !== profile.id) {
      if (verification?.status === 'unverified') {
        await authService.signOut().catch(() => undefined);
        unlockedUid.current = null;
        setProfile(null);
        setVerificationEmail(verification.email);
        setVerificationNotice('unverified');
        setEntry((current) => transitionEntry(current, { type: 'verificationRequired' }));
      } else if (!authService.currentUid()) {
        unlockedUid.current = null;
        setProfile(null);
        setEntry((current) => transitionEntry(current, { type: 'signOut' }));
      }
      return 'error';
    }
    const outcome = await biometricService.authenticate();
    if (outcome === 'success') {
      const afterPrompt = await authService.checkCurrentVerification().catch(() => null);
      if (afterPrompt?.status !== 'verified' || afterPrompt.uid !== profile.id) {
        if (afterPrompt?.status === 'unverified') {
          await authService.signOut().catch(() => undefined);
          unlockedUid.current = null;
          setProfile(null);
          setVerificationEmail(afterPrompt.email);
          setVerificationNotice('unverified');
          setEntry((current) => transitionEntry(current, { type: 'verificationRequired' }));
        } else if (!authService.currentUid()) {
          unlockedUid.current = null;
          setProfile(null);
          setEntry((current) => transitionEntry(current, { type: 'signOut' }));
        }
        return 'error';
      }
      setEntry((current) => transitionEntry(current, { type: 'biometricSuccess' }));
    }
    return outcome;
  }, [entry.hasAuthenticatedSession, profile]);
  const signOut = useCallback(async () => {
    if (authAction.current) throw new Error('auth-busy');
    authAction.current = true;
    authRevision.current += 1;
    try {
      await authService.signOut();
      unlockedUid.current = null;
      setVerificationEmail(null);
      setProfile(null);
      setEntry((current) => transitionEntry(current, { type: 'signOut' }));
    } finally {
      authAction.current = false;
    }
  }, []);

  const value = useMemo(() => ({
    ...entry, profile, verificationEmail, verificationNotice, verificationCooldownUntil, saveProfilePhoto, enterGuest, showWelcome, register, signIn, resendVerification, unlockWithBiometrics, signOut,
  }), [entry, profile, verificationEmail, verificationNotice, verificationCooldownUntil, saveProfilePhoto, enterGuest, showWelcome, register, signIn, resendVerification, unlockWithBiometrics, signOut]);

  return <EntryContext.Provider value={value}>{children}</EntryContext.Provider>;
}

export function useEntry(): EntryContextValue {
  const context = useContext(EntryContext);
  if (!context) throw new Error('EntryProvider no está disponible.');
  return context;
}
