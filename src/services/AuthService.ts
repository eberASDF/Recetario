import { FirebaseError } from 'firebase/app';
import type { AuthRegistrationResult, AuthRepository, AuthVerification } from '@/repositories/contracts';

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  observe(onChange: (identity: AuthVerification | null) => void, onError: (error: Error) => void): () => void {
    return this.repository.observe(onChange, onError);
  }

  register(email: string, password: string, displayName: string): Promise<AuthRegistrationResult> {
    return this.repository.register(email.trim().toLowerCase(), password, displayName.trim());
  }

  signIn(email: string, password: string): Promise<AuthVerification> {
    return this.repository.signIn(email.trim().toLowerCase(), password);
  }

  checkCurrentVerification(): Promise<AuthVerification | null> {
    return this.repository.checkCurrentVerification();
  }

  resendVerification(email: string, password: string): Promise<'sent' | 'already_verified'> {
    return this.repository.resendVerification(email.trim().toLowerCase(), password);
  }

  signOut(): Promise<void> {
    return this.repository.signOut();
  }

  currentUid(): string | null {
    return this.repository.currentUid();
  }
}

export function authErrorMessage(error: unknown, isRegister: boolean): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use': return 'Ese correo ya tiene una cuenta. Inicia sesión.';
      case 'auth/invalid-email': return 'Escribe un correo electrónico válido.';
      case 'auth/weak-password': return 'La contraseña es demasiado débil.';
      case 'auth/invalid-credential': return 'Correo o contraseña incorrectos.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
      case 'auth/network-request-failed': return 'Revisa tu conexión e inténtalo de nuevo.';
      case 'auth/invalid-password': return 'La contraseña no es correcta.';
    }
  }
  if (error instanceof Error && error.message === 'profile-missing') {
    return 'No encontramos los datos de tu cuenta. Comunícate con soporte.';
  }
  return isRegister
    ? 'No pudimos crear tu cuenta. Inténtalo de nuevo.'
    : 'No pudimos iniciar sesión. Inténtalo de nuevo.';
}
