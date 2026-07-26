import React from 'react';
import { Heart } from 'lucide-react';
import PersonCard from './PersonCard.jsx';

/**
 * Frames two partner members inside one unified card, per the spec:
 * "Partners are grouped side-by-side inside unified Couple Cards."
 * Each half remains individually clickable so a click focuses that specific
 * person rather than the pair as a whole.
 */
export default function CoupleCard({ members, onSelectPerson }) {
  const [a, b] = members;

  return (
    <div className="relative flex w-full items-stretch gap-1 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-1.5 dark:bg-accent/10">
      <div className="flex-1">
        <PersonCard member={a} onClick={onSelectPerson} />
      </div>
      <div className="flex w-4 shrink-0 items-center justify-center">
        <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
      </div>
      <div className="flex-1">
        {b ? (
          <PersonCard member={b} onClick={onSelectPerson} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-black/10 text-xs text-ink-light/40 dark:border-white/10 dark:text-ink-dark/40">
            Partner unknown
          </div>
        )}
      </div>
    </div>
  );
}
