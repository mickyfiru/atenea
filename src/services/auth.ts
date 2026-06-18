import type { ApplicationVerifier, Auth, ConfirmationResult, UserCredential } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { signInWithPhoneNumber, signOut } from 'firebase/auth';

import { auth, EXPECTED_FIREBASE_PROJECT_ID, isFirebaseConfigured } from './firebase';
import { ensureUserDocument } from './users';

const pendingConfirmations = new Map<string, ConfirmationResult>();

export function assertFirebaseAuthReady() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      'Firebase no esta configurado. Completa las variables EXPO_PUBLIC_FIREBASE_* en tu .env.',
    );
  }
}

function getReadyAuth(): Auth {
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      'Firebase no esta configurado. Completa las variables EXPO_PUBLIC_FIREBASE_* en tu .env.',
    );
  }

  return auth;
}

export function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/\s+/g, '');
}

export function verifyFirebaseProject(authInstance: Auth) {
  const projectId = authInstance.app.options.projectId;

  console.info('[ATENEA Firebase] auth.app.options.projectId:', projectId);

  if (projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    throw new Error(
      `Firebase Auth esta usando el proyecto "${projectId ?? 'desconocido'}"; se esperaba "${EXPECTED_FIREBASE_PROJECT_ID}".`,
    );
  }
}

export async function startPhoneSignIn(
  phoneNumber: string,
  verifier?: ApplicationVerifier,
): Promise<string> {
  const readyAuth = getReadyAuth();
  verifyFirebaseProject(readyAuth);

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const confirmationResult = await signInWithPhoneNumber(readyAuth, normalizedPhone, verifier);
  const confirmationId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  pendingConfirmations.set(confirmationId, confirmationResult);

  return confirmationId;
}

export async function verifyOtpCode(
  confirmationId: string,
  code: string,
): Promise<UserCredential> {
  const confirmationResult = pendingConfirmations.get(confirmationId);

  if (!confirmationResult) {
    throw new Error('La verificacion expiro. Solicita un nuevo codigo.');
  }

  const credential = await confirmationResult.confirm(code.trim());
  pendingConfirmations.delete(confirmationId);
  await ensureUserDocument(credential.user);

  return credential;
}

export async function logout() {
  await signOut(getReadyAuth());
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'El numero debe estar en formato internacional, por ejemplo +56912345678.';
      case 'auth/missing-phone-number':
        return 'Ingresa un numero telefonico para continuar.';
      case 'auth/invalid-verification-code':
        return 'El codigo ingresado no es valido. Revisalo e intenta nuevamente.';
      case 'auth/code-expired':
        return 'El codigo expiro. Solicita un nuevo codigo.';
      case 'auth/too-many-requests':
        return 'Se bloquearon temporalmente los intentos por actividad inusual. Intenta mas tarde.';
      case 'auth/quota-exceeded':
        return 'Se alcanzo el limite de SMS del proyecto Firebase.';
      case 'auth/captcha-check-failed':
      case 'auth/missing-app-credential':
      case 'auth/invalid-app-credential':
        return 'No se pudo validar reCAPTCHA. Intenta nuevamente.';
      case 'auth/operation-not-allowed':
        return 'Phone Authentication no esta habilitado en Firebase Auth.';
      case 'auth/network-request-failed':
        return 'No hay conexion con Firebase. Revisa tu internet e intenta nuevamente.';
      default:
        return `Firebase Auth: ${error.message}`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrio un error inesperado. Intenta nuevamente.';
}

export function logAuthError(error: unknown) {
  if (error instanceof FirebaseError) {
    console.error('[ATENEA Firebase Auth] error.code:', error.code);
    console.error('[ATENEA Firebase Auth] error.message:', error.message);
    return;
  }

  if (error instanceof Error) {
    console.error('[ATENEA Firebase Auth] error.code:', 'non-firebase-error');
    console.error('[ATENEA Firebase Auth] error.message:', error.message);
    return;
  }

  console.error('[ATENEA Firebase Auth] error.code:', 'unknown-error');
  console.error('[ATENEA Firebase Auth] error.message:', String(error));
}
