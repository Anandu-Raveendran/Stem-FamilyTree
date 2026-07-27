import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Plus, LogIn, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/common/Toast.jsx';
import DarkModeToggle from '../components/common/DarkModeToggle.jsx';
import {
  createFamily,
  listAccessibleFamilies,
  getFamily,
} from '../services/familyService.js';

const RECENT_KEY = 'family-tree-recent-id';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn } = useAuth();
  const toast = useToast();

  const [checkingRecent, setCheckingRecent] = useState(true);
  const [accessible, setAccessible] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [recentTreeId, setRecentTreeId] = useState(null);
  const [recentTreeName, setRecentTreeName] = useState('');

  useEffect(() => {
    const recentId = window.localStorage.getItem(RECENT_KEY);
    if (!recentId) {
      setCheckingRecent(false);
      return;
    }

    getFamily(recentId)
      .then((family) => {
        if (family) {
          setRecentTreeId(recentId);
          setRecentTreeName(family.name || 'Recent family tree');
        }
        setCheckingRecent(false);
      })
      .catch(() => setCheckingRecent(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    listAccessibleFamilies(user.uid, user.email)
      .then(setAccessible)
      .catch(() => {});
  }, [isAuthenticated, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!isAuthenticated) {
      toast.info('Sign in first so you own and can edit the new tree.');
      return;
    }
    setCreating(true);
    try {
      const id = await createFamily({
        name: newName.trim(),
        ownerId: user.uid,
        ownerEmail: user.email,
      });
      window.localStorage.setItem(RECENT_KEY, id);
      navigate(`/tree/${id}/add`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (checkingRecent) return null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-canvas-light px-4 py-16 dark:bg-canvas-dark">
      <div className="fixed right-4 top-4">
        <DarkModeToggle />
      </div>

      <GitBranch className="h-10 w-10 text-accent" strokeWidth={1.5} />
      <h1 className="mt-4 font-display text-3xl font-semibold">Family Tree</h1>
      <p className="mt-2 max-w-md text-center text-sm text-ink-light/60 dark:text-ink-dark/60">
        Map your family, generation by generation. View any tree without an
        account - sign in to add or edit people.
      </p>

      <button
        type="button"
        onClick={() => navigate('/how-to')}
        className="mt-6 flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-neutral-900/80 dark:hover:bg-neutral-800"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        How to use
      </button>

      {!isAuthenticated && (
        <button
          type="button"
          onClick={signIn}
          className="mt-6 flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-card transition hover:bg-accent/90"
        >
          <LogIn className="h-4 w-4" />
          Continue with Google
        </button>
      )}

      <form
        onSubmit={handleCreate}
        className="mt-10 flex w-full max-w-sm gap-2 rounded-full border border-black/10 bg-white p-1.5 shadow-card dark:border-white/10 dark:bg-neutral-900"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Name a new family tree…"
          className="flex-1 rounded-full bg-transparent px-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-1.5 rounded-full bg-ink-light px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-ink-light"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>

      {recentTreeId && (
        <div className="mt-10 w-full max-w-sm">
          <h2 className="mb-2 text-sm font-medium text-ink-light/60 dark:text-ink-dark/60">
            Recently visited
          </h2>
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(RECENT_KEY, recentTreeId);
              navigate(`/tree/${recentTreeId}`);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-medium shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover dark:border-white/10 dark:bg-neutral-900"
          >
            <span>{recentTreeName}</span>
            <ArrowRight className="h-4 w-4 text-ink-light/40 dark:text-ink-dark/40" />
          </button>
        </div>
      )}

      {isAuthenticated && accessible.length > 0 && (
        <div className="mt-8 w-full max-w-sm">
          <h2 className="mb-2 text-sm font-medium text-ink-light/60 dark:text-ink-dark/60">
            Your trees
          </h2>
          <ul className="flex flex-col gap-2">
            {accessible.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.setItem(RECENT_KEY, f.id);
                    navigate(`/tree/${f.id}`);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-medium shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover dark:border-white/10 dark:bg-neutral-900"
                >
                  {f.name}
                  <ArrowRight className="h-4 w-4 text-ink-light/40 dark:text-ink-dark/40" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/about')}
        className="mt-6 flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-neutral-900/80 dark:hover:bg-neutral-800"
      >
          About Us
      </button>
    </div>
  );
}
