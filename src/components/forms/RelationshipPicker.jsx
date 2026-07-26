import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * A searchable multi-select for choosing existing members as relationships
 * (parents, partners, or children) when building or editing a person.
 *
 * @param {{ label: string, members: Array, selectedIds: string[], onChange: (ids: string[]) => void, excludeId?: string, max?: number }} props
 */
export default function RelationshipPicker({
  label,
  members,
  selectedIds,
  onChange,
  excludeId,
  max,
}) {
  const [query, setQuery] = useState('');

  const options = useMemo(
    () =>
      members.filter(
        (m) =>
          m.id !== excludeId &&
          m.name.toLowerCase().includes(query.toLowerCase()) &&
          !selectedIds.includes(m.id)
      ),
    [members, excludeId, query, selectedIds]
  );

  const selectedMembers = useMemo(
    () => selectedIds.map((id) => members.find((m) => m.id === id)).filter(Boolean),
    [selectedIds, members]
  );

  const addId = (id) => {
    if (max && selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
    setQuery('');
  };

  const removeId = (id) => onChange(selectedIds.filter((existing) => existing !== id));

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
        {label}
      </label>

      {selectedMembers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedMembers.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900 dark:text-brand-200"
            >
              {m.name}
              <button
                type="button"
                onClick={() => removeId(m.id)}
                aria-label={`Remove ${m.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {(!max || selectedIds.length < max) && (
        <div className="relative">
          <div className="flex items-center rounded-lg border border-black/10 px-2.5 py-1.5 dark:border-white/10">
            <Search className="h-3.5 w-3.5 text-ink-light/40 dark:text-ink-dark/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search existing members…"
              className="ml-2 w-full bg-transparent text-sm outline-none"
            />
          </div>
          {query && (
            <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-black/10 bg-white shadow-cardHover dark:border-white/10 dark:bg-neutral-900">
              {options.length ? (
                options.slice(0, 6).map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => addId(m.id)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      {m.name}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-3 py-1.5 text-sm text-ink-light/40 dark:text-ink-dark/40">
                  No matches
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
