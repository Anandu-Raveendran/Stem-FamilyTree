import React, { useRef } from 'react';
import { Heart, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
  focusedPersonId,
  isFocused = false,
  onAddChild,
  onAddPartner,
  onAddParent,
  onAddSibling,
  onFocusCouple,
  onReorderSibling,
  parentIds = [],
  onLongPress,
}) {
  const [a, b] = members;
  const longPressTimerRef = useRef(null);

  const clearTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLongPressStart = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    clearTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      clearTimer();
      onLongPress?.(members);
    }, 450);
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearTimer();
    onLongPress?.(members);
  };

  return (
    <div
      role="group"
      onClick={onFocusCouple}
      onMouseDown={handleLongPressStart}
      onMouseUp={clearTimer}
      onMouseLeave={clearTimer}
      onContextMenu={handleContextMenu}
      onTouchStart={handleLongPressStart}
      onTouchEnd={clearTimer}
      onTouchCancel={clearTimer}
      className={`relative flex w-full items-stretch gap-1 rounded-2xl border border-dashed bg-accent/5 p-1.5 dark:bg-accent/10 ${
      isFocused ? 'border-accent ring-2 ring-accent/25' : 'border-accent/40'
      }`}
    >
      {isFocused && onReorderSibling && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onReorderSibling(a.id, parentIds, 'left');
            }}
            aria-label={`Move ${a.name} left`}
            className="absolute -left-3 top-1/2 z-20 flex h-8 w-8 -translate-x-full -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onReorderSibling(a.id, parentIds, 'right');
            }}
            aria-label={`Move ${a.name} right`}
            className="absolute -right-3 top-1/2 z-20 flex h-8 w-8 translate-x-full -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-900 dark:text-slate-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      <div className="flex-1">
        <PersonCard
          member={a}
          onClick={onSelectPerson}
          onLongPress={() => onLongPress?.(members)}
          isSyncing={syncingMemberIds.has(a.id)}
          isFocused={focusedPersonId === a.id}
          onAddPartner={() => onAddPartner?.(a.id)}
          onAddParent={() => onAddParent?.(a.id)}
          onAddSibling={() => onAddSibling?.(a.id)}
        />
      </div>
      <div className="flex w-4 shrink-0 items-center justify-center">
        <Heart className="h-3.5 w-3.5 fill-accent text-accent" />
      </div>
      <div className="flex-1">
        {b ? (
          <PersonCard
            member={b}
            onClick={onSelectPerson}
            onLongPress={() => onLongPress?.(members)}
            isSyncing={syncingMemberIds.has(b.id)}
            isFocused={focusedPersonId === b.id}
            onAddPartner={() => onAddPartner?.(b.id)}
            onAddParent={() => onAddParent?.(b.id)}
            onAddSibling={() => onAddSibling?.(b.id)}
          />
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
