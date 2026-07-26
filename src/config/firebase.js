/**
 * Firebase initialization.
 *
 * All environment variables are read here and only here. Every other module
 * (services, hooks, components) must import the initialized `app`, `auth`,
 * `db`, and `storage` instances from this file rather than calling
 * `initializeApp` a second time.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

function readEnv(key, required = true) {
  const value = import.meta.env[key];
  if (required && !value) {
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase config] Missing environment variable ${key}. Copy .env.example to .env and fill in your Firebase project credentials.`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
