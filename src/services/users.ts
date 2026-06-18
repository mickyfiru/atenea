import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { db } from './firebase';
import { ensureDefaultGroupsForUser } from './groups';

export async function ensureUserDocument(user: User) {
  if (!db) {
    throw new Error('Firestore no esta configurado.');
  }

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      id: user.uid,
      phoneNumber: user.phoneNumber ?? '',
      displayName: '',
      createdAt: serverTimestamp(),
    });
  }

  await ensureDefaultGroupsForUser(user.uid);
}
