import { useAuthContext } from '../context/AuthContext.jsx';

/**
 * @returns {{ user: import('firebase/auth').User|null, loading: boolean, isAuthenticated: boolean, signIn: () => Promise<void>, signOut: () => Promise<void> }}
 */
export function useAuth() {
  return useAuthContext();
}
