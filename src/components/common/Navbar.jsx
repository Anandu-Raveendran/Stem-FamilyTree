import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';
import {
  normalizePendingRequestValue,
  requestAdminAccess,
} from '../../services/familyService.js';
import { useToast } from './Toast.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import AdminRequestModal from '../../pages/AdminRequestModal.jsx';

export default function Navbar() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const { family, familyId, isAdmin } = useFamilyTree();
  const toast = useToast();
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const requestedValue = (user?.email || user?.uid || '').trim().toLowerCase();
  const alreadyRequested =
    isAuthenticated &&
    (family?.pendingRequests || []).some((entry) =>
      normalizePendingRequestValue(entry, requestedValue) === requestedValue
    );

  const handleLogin = async () => {
    try {
      await signIn();
    } catch (err) {
      toast.error(`Sign-in failed: ${err.message}`);
    }
  };

  const handleRequestAccess = async () => {
    if (!familyId || !user) return;
    setRequesting(true);
    try {
      await requestAdminAccess(familyId, user.uid, user.email);
      toast.success('Request sent - the owner will review it.');
    } catch (err) {
      toast.error(`Could not send request: ${err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  // Shared classes: icon-only on mobile, icon+label from sm: up.
  const pillBtn =
    'flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2.5 py-2 sm:px-3 text-sm font-medium shadow-card backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900/80 dark:hover:bg-neutral-900';
  const labelClass = 'hidden sm:inline';

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-4">
        <Link
          to="/"
          className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-neutral-900/80"
        >
          <GitBranch className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate font-display text-sm font-semibold max-w-[40vw] sm:max-w-none">
            {family?.name || 'Family Tree'}
          </span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          <DarkModeToggle />

          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminPanelOpen(true)}
              aria-label="Admin panel"
              className={pillBtn}
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
              <span className={labelClass}>Admin panel</span>
            </button>
          )}

          {!isAdmin && isAuthenticated && familyId && (
            <button
              type="button"
              disabled={requesting || alreadyRequested}
              onClick={handleRequestAccess}
              aria-label={alreadyRequested ? 'Request pending' : 'Request edit access'}
              className={pillBtn}
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className={labelClass}>
                {alreadyRequested ? 'Request pending' : 'Request edit access'}
              </span>
            </button>
          )}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className={pillBtn}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={labelClass}>Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              aria-label="Login to edit"
              className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-2 sm:px-3 text-sm font-medium text-white shadow-card transition hover:bg-accent/90"
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span className={labelClass}>Login to edit</span>
            </button>
          )}
        </div>
      </header>

      <AdminRequestModal
        open={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
    </>
  );
}