import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, LogIn, LogOut, Menu, Pencil, ShieldCheck, PlusCircle, Home, BookOpen, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';
import {
  normalizePendingRequestValue,
  requestAdminAccess,
  listAccessibleFamilies,
} from '../../services/familyService.js';
import { useToast } from './Toast.jsx';
import DarkModeToggle from './DarkModeToggle.jsx';
import AdminRequestModal from '../../pages/AdminRequestModal.jsx';
import SearchBar from '../tree/SearchBar.jsx';

export default function Navbar() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const { family, familyId, isAdmin, canEdit, pendingSyncCount, focusPerson } = useFamilyTree();
  const toast = useToast();
  const navigate = useNavigate();
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [accessibleFamilies, setAccessibleFamilies] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleEditAccessClick = async () => {
    if (!familyId) return;

    if (!isAuthenticated) {
      await handleLogin();
      toast.info('Please sign in to request edit access.');
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
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-neutral-900/80">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition hover:bg-black/5 dark:text-ink-dark dark:hover:bg-white/10"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative flex min-w-0 items-center gap-2">
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
          {pendingSyncCount > 0 && (
            <span
              role="status"
              aria-label={`${pendingSyncCount} change${pendingSyncCount === 1 ? '' : 's'} syncing`}
              className="flex shrink-0 items-center gap-1 text-xs text-ink-light/60 dark:text-ink-dark/60"
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">Syncing</span>
            </span>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <SearchBar
            compact
            className="sm:hidden"
            onSelect={(member) => {
              focusPerson(member.id);
              navigate(`/tree/${familyId}/person/${member.id}`);
            }}
          />
          <DarkModeToggle />
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[40] transition ${sidebarOpen ? 'pointer-events-auto bg-black/40' : 'pointer-events-none bg-transparent'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-[45] flex h-full w-72 max-w-[85vw] flex-col border-r border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur transition-transform duration-200 dark:border-white/10 dark:bg-neutral-900/95 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold">Menu</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-full p-2 text-sm text-ink-light/70 transition hover:bg-black/5 dark:text-ink-dark/70 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              navigate('/');
            }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
          >
            <Home className="h-4 w-4" />
            Home
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              navigate('/how-to');
            }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
          >
            <BookOpen className="h-4 w-4" />
            How to use
          </button>

          <button
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              navigate('/');
            }}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            Create new family tree
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                setAdminPanelOpen(true);
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4 text-accent" />
              Admin panel
            </button>
          )}

          {isAuthenticated && !isAdmin && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                handleEditAccessClick();
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4 text-accent" />
              Request admin access
            </button>
          )}

          {isAuthenticated && (!canEdit || alreadyRequested || !familyId) && (
            <button
              type="button"
              disabled={requesting || alreadyRequested}
              onClick={() => {
                setSidebarOpen(false);
                handleEditAccessClick();
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-ink-dark dark:hover:bg-slate-800"
            >
              <Pencil className="h-4 w-4" />
              {alreadyRequested ? 'Request pending' : familyId ? 'Request edit access' : 'Login to edit'}
            </button>
          )}

          <div className="mt-2 border-t border-black/10 pt-3 dark:border-white/10" />

          {isAuthenticated ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">
                  {user?.displayName || user?.email || 'Signed in'}
                </p>
                {user?.email && (
                  <p className="text-xs text-ink-light/60 dark:text-ink-dark/60">
                    {user.email}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  signOut();
                }}
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-medium text-ink-light transition hover:bg-slate-100 dark:text-ink-dark dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                handleLogin();
              }}
              className="flex items-center gap-3 rounded-2xl bg-accent px-3 py-3 text-left text-sm font-medium text-white transition hover:bg-accent/90"
            >
              <LogIn className="h-4 w-4" />
              Login for admin access
            </button>
          )}
        </div>
      </aside>

      <AdminRequestModal
        open={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
    </>
  );
}
