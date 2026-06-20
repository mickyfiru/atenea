import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Persistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

export const EXPECTED_FIREBASE_PROJECT_ID = 'atena-5ebd9';

export const firebaseConfig = {
  apiKey: 'AIzaSyDxvEioJdy0wJ-HDkTwaQHNmh_3uLs0CTc',
  authDomain: 'atena-5ebd9.firebaseapp.com',
  projectId: EXPECTED_FIREBASE_PROJECT_ID,
  storageBucket: 'atena-5ebd9.firebasestorage.app',
  messagingSenderId: '915187577180',
  appId: '1:915187577180:web:af722e359a97d104859199',
  measurementId: 'G-PV8PV178NF',
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

type ReactNativeAuthModule = {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : undefined;

function createAuth() {
  if (!firebaseApp) {
    return undefined;
  }

  try {
    const persistence: Persistence =
      Platform.OS === 'web'
        ? browserLocalPersistence
        : // Firebase exposes this helper from its React Native conditional export at runtime.
          (require('@firebase/auth') as ReactNativeAuthModule).getReactNativePersistence(
            AsyncStorage,
          );

    return initializeAuth(firebaseApp, {
      persistence,
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth();
export const db = firebaseApp ? getFirestore(firebaseApp) : undefined;
export const storage = firebaseApp ? getStorage(firebaseApp) : undefined;
