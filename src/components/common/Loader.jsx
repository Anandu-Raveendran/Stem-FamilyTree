import React from 'react';
import { GitBranch } from 'lucide-react';

/**
 * Full-viewport loading state used while a family tree or auth state is
 * being resolved.
 */
export default function Loader({ label = 'Loading your family tree…' }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-canvas-light dark:bg-canvas-dark">
      <GitBranch
        className="h-10 w-10 animate-pulse text-accent"
        strokeWidth={1.5}
      />
      <p className="font-body text-sm text-ink-light/70 dark:text-ink-dark/70">
        {label}
      </p>
    </div>
  );
}
