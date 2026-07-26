import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/common/Toast.jsx';
import { createFamily, listAccessibleFamilies } from '../services/familyService.js';

export default function ErrorPage({ message = "This family tree doesn't exist." }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn } = useAuth();
  const toast = useToast();
  const [trees, setTrees] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    listAccessibleFamilies(user.uid, user.email).then(setTrees).catch(() => {});
  }, [isAuthenticated, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !user) return;
    try {
      const id = await createFamily({
        name: newName.trim(),
        ownerId: user.uid,
        ownerEmail: user.email,
      });
      navigate(`/tree/${id}/add`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas-light px-6 text-center dark:bg-canvas-dark">
      <AlertCircle className="h-10 w-10 text-accent" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-semibold">{message}</h1>

      {isAuthenticated ? (
        <div className="mt-4 w-full max-w-sm">
          {trees.length > 0 && (
            <>
              <p className="mb-2 text-sm text-ink-light/60 dark:text-ink-dark/60">
                Here are the trees you can access:
              </p>
              <ul className="mb-6 flex flex-col gap-2">
                {trees.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/tree/${f.id}`)}
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium shadow-card hover:-translate-y-0.5 hover:shadow-cardHover dark:border-white/10 dark:bg-neutral-900"
                    >
                      {f.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <form
            onSubmit={handleCreate}
            className="flex gap-2 rounded-full border border-black/10 bg-white p-1.5 shadow-card dark:border-white/10 dark:bg-neutral-900"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name a new family tree…"
              className="flex-1 rounded-full bg-transparent px-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={signIn}
          className="mt-2 flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-card hover:bg-accent/90"
        >
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </button>
      )}
    </div>
  );
}
