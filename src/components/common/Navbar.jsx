import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, LogIn, LogOut, Pencil, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';
import {
  normalizePendingRequestValue,
  requestAdminAccess,
  listAccessibleFamilies,
} from '../../services/familyService.js';
import { useToast } from './Toast.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import Modal from './Modal.jsx';
import AdminRequestModal from '../../pages/AdminRequestModal.jsx';

export default function Navbar() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const { family, familyId, isAdmin, canEdit } = useFamilyTree();
  const toast = useToast();
  const navigate = useNavigate();
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [accessibleFamilies, setAccessibleFamilies] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAccessibleFamilies([]);
      return undefined;
    }

    let isMounted = true;
    listAccessibleFamilies(user.uid, user.email)
      .then((families) => {
        if (isMounted) setAccessibleFamilies(families);
      })
      .catch(() => {
        if (isMounted) setAccessibleFamilies([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const handleEditAccessClick = () => {
    if (!familyId) return;

    const confirmMessage = isAuthenticated
      ? alreadyRequested
        ? 'A request is already pending. Would you like to send another request?'
        : 'Request edit access to this family tree?'
      : 'You need to log in before requesting edit access. Log in now?';

    setConfirmAction({
      message: confirmMessage,
      isLoginAction: !isAuthenticated,
    });
    setConfirmModalOpen(true);
  };

  const confirmAccessAction = async () => {
    setConfirmModalOpen(false);

    if (!familyId) return;

    if (!isAuthenticated) {
      await handleLogin();
      return;
    }

    if (alreadyRequested) {
      toast.info('A request is already pending for this account.');
      return;
    }

    await handleRequestAccess();
  };

  // Shared classes: icon-only on mobile, icon+label from sm: up.
  const pillBtn =
    'flex items-center gap-1.5 rounded-full border border-black/10 bg-white/80 px-2.5 py-2 sm:px-3 text-sm font-medium shadow-card backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900/80 dark:hover:bg-neutral-900';
  const labelClass = 'hidden sm:inline';

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-4">
        <div className="relative pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-neutral-900/80">
          <GitBranch className="h-4 w-4 shrink-0 text-accent" />
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className="flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-ink-light dark:text-ink-dark"
          >
            <span className="truncate max-w-[30vw] sm:max-w-none">
              {family?.name || 'Family Tree'}
            </span>
            <span className="text-ink-light/70 dark:text-ink-dark/70">▾</span>
          </button>

          {dropdownOpen && accessibleFamilies.length > 0 && (
            <div className="absolute left-0 top-full z-40 mt-2 min-w-[220px] rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900">
              <div className="max-h-72 overflow-y-auto p-2">
                {accessibleFamilies.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate(`/tree/${f.id}`);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
                  >
                    <span className="truncate text-ink-light dark:text-ink-dark">{f.name}</span>
                    {f.id === familyId && <span className="text-xs text-ink-light/70 dark:text-ink-dark/70">Current</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

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

          {!canEdit && familyId && (
            <button
              type="button"
              disabled={requesting || alreadyRequested}
              onClick={handleEditAccessClick}
              aria-label={alreadyRequested ? 'Request pending' : 'Request edit access'}
              className={pillBtn}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              <span className={labelClass}>
                {alreadyRequested ? 'Request pending' : isAuthenticated ? 'Request edit access' : 'Login to edit'}
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

      <Modal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Edit access"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-light/70 dark:text-ink-dark/70">
            {confirmAction?.message || 'Continue with this action?'}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmModalOpen(false)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAccessAction}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              {confirmAction?.isLoginAction ? 'Log in' : 'Continue'}
            </button>
          </div>
        </div>
      </Modal>

      <AdminRequestModal
        open={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
    </>
  );
}