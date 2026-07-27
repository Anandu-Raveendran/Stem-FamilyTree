import React from 'react';
import { Heart, Plus } from 'lucide-react';
import PersonCard from './PersonCard.jsx';

/**
 * Frames two partner members inside one unified card, per the spec:
 * "Partners are grouped side-by-side inside unified Couple Cards."
 * Each half remains individually clickable so a click focuses that specific
 * person rather than the pair as a whole.
 */
export default function CoupleCard({
  members,
  onSelectPerson,
  syncingMemberIds = new Set(),
  isFocused = false,
  onAddChild,
}) {
  const [a, b] = members;

  return (
    <div className={`relative flex w-full items-stretch gap-1 rounded-2xl border border-dashed bg-accent/5 p-1.5 dark:bg-accent/10 ${
      isFocused ? 'border-accent ring-2 ring-accent/25' : 'border-accent/40'
    }`}>
      <div className="flex-1">
        <PersonCard member={a} onClick={onSelectPerson} isSyncing={syncingMemberIds.has(a.id)} />
      </div>
      <div className="flex w-4 shrink-0 items-center justify-center">
        <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
      </div>
      <div className="flex-1">
        {b ? (
          <PersonCard member={b} onClick={onSelectPerson} isSyncing={syncingMemberIds.has(b.id)} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-black/10 text-xs text-ink-light/40 dark:border-white/10 dark:text-ink-dark/40">
            Partner unknown
          </div>
        )}
      </div>
      {isFocused && onAddChild && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddChild();
          }}
          className="absolute left-1/2 top-full z-20 mt-2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-blue-500 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-200"
        >
          <Plus className="h-3 w-3" />
          Add child
        </button>
      )}
    </div>
  );
}
