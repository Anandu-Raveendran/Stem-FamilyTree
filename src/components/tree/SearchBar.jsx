import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';

export default function SearchBar({ onSelect }) {
  const { searchMembers } = useFamilyTree();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => searchMembers(query).slice(0, 8), [searchMembers, query]);

  const handleSelect = (member) => {
    onSelect?.(member);
    setQuery(member.name);
    setOpen(false);
  };

  return (
    <div className="pointer-events-auto fixed left-4 top-20 z-20 w-full max-w-xs sm:top-24">
      <div className="relative flex items-center rounded-full border border-black/10 bg-white/90 px-3 py-2 shadow-card backdrop-blur dark:border-white/10 dark:bg-neutral-900/90">
        <Search className="h-4 w-4 shrink-0 text-ink-light/50 dark:text-ink-dark/50" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Find a family member…"
          aria-label="Search family members"
          className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-ink-light/40 dark:placeholder:text-ink-dark/40"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
          >
            <X className="h-4 w-4 text-ink-light/40 dark:text-ink-dark/40" />
          </button>
        )}
      </div>

      {open && query && (
        <ul className="mt-2 max-h-64 overflow-auto rounded-xl border border-black/10 bg-white/95 py-1 shadow-cardHover backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
          {results.length ? (
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(m)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  {m.name}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-ink-light/50 dark:text-ink-dark/50">
              No matches found.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
