import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Home, Calendar, Pencil, RefreshCw } from 'lucide-react';
import { getPlaceholderImage } from '../../services/storageService.js';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';

export default function PersonCard({ member, onClick, compact = false, deceased, isSyncing = false }) {
  const navigate = useNavigate();
  const { familyId, isAdmin, canEdit } = useFamilyTree();
  const isDeceased = deceased ?? !!member.dateOfDeath;

  const handleEdit = (e) => {
    e.stopPropagation(); // don't also trigger onClick/focus
    navigate(`/tree/${familyId}/person/${member.id}/edit`);
  };

  return (
    <button
      type="button"
      onClick={() => onClick?.(member)}
      className={`group relative flex w-full items-start gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover dark:bg-neutral-900 ${
        isDeceased
          ? 'border-neutral-300 grayscale dark:border-neutral-700'
          : 'border-black/10 dark:border-white/10'
      }`}
    >
      <img
        src={member.imageUrl || getPlaceholderImage(member.id || member.name)}
        alt={member.name}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
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
          <div className="mt-0.5 flex flex-col gap-0.5">
            {member.job && (
              <p className="flex items-center gap-1 truncate text-xs text-ink-light/60 dark:text-ink-dark/60">
                <Briefcase className="h-3 w-3 shrink-0" />
                {member.job}
              </p>
            )}
            {member.location && (
              <p className="flex items-center gap-1 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <MapPin className="h-3 w-3 shrink-0" />
                {member.location}
              </p>
            )}
            {member.houseName && (
              <p className="flex items-center gap-1 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <Home className="h-3 w-3 shrink-0" />
                {member.houseName}
              </p>
            )}
            {(member.dateOfBirth || member.dateOfDeath) && (
              <p className="flex items-center gap-1 truncate text-xs text-ink-light/50 dark:text-ink-dark/50">
                <Calendar className="h-3 w-3 shrink-0" />
                {member.dateOfBirth || '?'} – {member.dateOfDeath || 'present'}
              </p>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={handleEdit}
          aria-label={`Edit ${member.name}`}
className="absolute right-2 top-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-ink-light/60 transition hover:bg-black/10 hover:text-ink-light dark:bg-white/10 dark:text-ink-dark/60 dark:hover:bg-white/20 dark:hover:text-ink-dark"        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </button>
  );
}
