/**
 * Isolated Auth service layer. UI components and hooks should call these
 * functions instead of touching `firebase/auth` directly.
 */
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase.js';

/**
 * Opens the Google OAuth popup and signs the user in.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs the current user out.
 * @returns {Promise<void>}
 */
export function signOutUser() {
  return firebaseSignOut(auth);
}

/**
 * Subscribes to auth state changes.
 * @param {(user: import('firebase/auth').User | null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
