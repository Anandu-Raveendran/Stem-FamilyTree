import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Generic centered modal / drawer shell. Closes on Escape or backdrop click.
 */
export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} animate-pop-in rounded-2xl bg-white p-6 shadow-cardHover dark:bg-neutral-900`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && (
            <h2 className="font-display text-xl font-semibold text-ink-light dark:text-ink-dark">
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-light/60 transition hover:bg-black/5 hover:text-ink-light dark:text-ink-dark/60 dark:hover:bg-white/10 dark:hover:text-ink-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
