import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Home, Calendar, Pencil, Plus, RefreshCw } from 'lucide-react';
import { getPlaceholderImage } from '../../services/storageService.js';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';

export default function PersonCard({
  member,
  onClick,
  compact = false,
  deceased,
  isSyncing = false,
  isFocused = false,
  onAddChild,
  onAddPartner,
  onAddParent,
}) {
  const navigate = useNavigate();
  const { familyId, isAdmin, canEdit } = useFamilyTree();
  const isDeceased = deceased ?? !!member.dateOfDeath;

  const handleEdit = (event) => {
    event.stopPropagation(); // don't also trigger onClick/focus
    navigate(`/tree/${familyId}/person/${member.id}/edit`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(member);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.(member);
        }
      }}
      className={`group relative flex w-full flex-col cursor-pointer rounded-xl border bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover dark:bg-neutral-900 ${
        isDeceased
          ? 'border-neutral-300 grayscale dark:border-neutral-700'
          : isFocused
            ? 'border-accent ring-2 ring-accent/25 dark:border-accent'
            : 'border-black/10 dark:border-white/10'
      }`}
    >
      {/* --- Top Container: Square Image + Floating Edit Button --- */}
      <div className="relative mb-2.5 w-full">
        <img
          src={member.imageUrl || getPlaceholderImage(member.id || member.name)}
          alt={member.name}
          className="aspect-square w-full rounded-lg object-cover ring-1 ring-black/5 dark:ring-white/10"
          loading="lazy"
        />

        {/* Edit Button overlayed on top-right of image */}
        {canEdit && (
          <button
            type="button"
            onClick={handleEdit}
            aria-label={`Edit ${member.name}`}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 dark:bg-neutral-900/60 dark:hover:bg-neutral-900/80"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* --- Bottom Container: Details --- */}
      <div className="min-w-0 w-full flex-1">
        <p className="flex items-center gap-1 truncate font-display text-sm font-semibold leading-tight">
          {member.name}
          {isSyncing && (
            <RefreshCw
              aria-label="Changes syncing"
              className="h-3 w-3 shrink-0 animate-spin text-accent"
            />
          )}
          {isDeceased && (
            <span className="ml-1 text-xs font-normal text-ink-light/50 dark:text-ink-dark/50">
              †
            </span>
          )}
        </p>

        {!compact && (
          <div className="mt-1.5 flex flex-col gap-1">
            {member.job && (
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-light/60 dark:text-ink-dark/60">
                <Briefcase className="h-3 w-3 shrink-0" />
                {member.job}
              </p>
            )}
            {member.location && (
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <MapPin className="h-3 w-3 shrink-0" />
                {member.location}
              </p>
            )}
            {member.houseName && (
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <Home className="h-3 w-3 shrink-0" />
                {member.houseName}
              </p>
            )}
            {(member.dateOfBirth || member.dateOfDeath) && (
              <p className="flex items-center gap-1.5 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <Calendar className="h-3 w-3 shrink-0" />
                {member.dateOfBirth || '?'} – {member.dateOfDeath || 'present'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* --- Action Buttons Popover (Kept identical for tree node selection) --- */}
      {isFocused && canEdit && (onAddChild || onAddPartner || onAddParent) && (
        <div className="absolute left-1/2 top-full z-20 mt-2 flex -translate-x-1/2 gap-1.5 whitespace-nowrap">
          {onAddParent && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddParent();
              }}
              className="flex items-center gap-1 rounded-full border border-dashed border-emerald-500 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-200"
            >
              <Plus className="h-3 w-3" />
              Add parent
            </button>
          )}
          {onAddChild && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddChild();
              }}
              className="flex items-center gap-1 rounded-full border border-dashed border-blue-500 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-200"
            >
              <Plus className="h-3 w-3" />
              Add child
            </button>
          )}
          {onAddPartner && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddPartner();
              }}
              className="flex items-center gap-1 rounded-full border border-dashed border-rose-400 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:bg-rose-950/70 dark:text-rose-200"
            >
              <Plus className="h-3 w-3" />
              Add partner
            </button>
          )}
        </div>
      )}
    </div>
  );
}