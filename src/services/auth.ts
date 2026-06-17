import type { ApplicationVerifier, ConfirmationResult } from 'firebase/auth';
import { signInWithPhoneNumber } from 'firebase/auth';

import { auth, isFirebaseConfigured } from './firebase';

type PhoneSignInResult =
  | { mode: 'firebase'; confirmationResult: ConfirmationResult }
  | { mode: 'mock'; verificationId: string };

export async function startPhoneSignIn(
  phoneNumber: string,
  verifier?: ApplicationVerifier,
): Promise<PhoneSignInResult> {
  if (isFirebaseConfigured && auth && verifier) {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return { mode: 'firebase', confirmationResult };
  }

  return { mode: 'mock', verificationId: `mock-${Date.now()}` };
}

export async function verifyOtpCode(
  code: string,
  confirmationResult?: ConfirmationResult,
): Promise<boolean> {
  if (confirmationResult) {
    await confirmationResult.confirm(code);
    return true;
  }

  return code.trim().length >= 4;
}
