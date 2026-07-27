import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';

export default function SearchBar({ onSelect, compact = false, className = '' }) {
  const { searchMembers } = useFamilyTree();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const results = useMemo(() => searchMembers(query).slice(0, 8), [searchMembers, query]);

  const handleSelect = (member) => {
    onSelect?.(member);
    setQuery('');
    setOpen(false);
  };

  useEffect(() => {
    if (compact && open) inputRef.current?.focus();
  }, [compact, open]);

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Search family members"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80 text-ink-light shadow-card backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-neutral-900/80 dark:text-ink-dark dark:hover:bg-neutral-900"
        >
          {open ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-black/10 bg-white/95 p-2 shadow-cardHover backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
            <div className="flex items-center rounded-xl bg-black/5 px-3 py-2 dark:bg-white/10">
              <Search className="h-4 w-4 shrink-0 text-ink-light/50 dark:text-ink-dark/50" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a family member…"
                aria-label="Search family members"
                className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-ink-light/40 dark:placeholder:text-ink-dark/40"
              />
            </div>

            {query && (
              <SearchResults results={results} onSelect={handleSelect} />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`pointer-events-auto fixed left-4 top-20 z-20 w-full max-w-xs sm:top-24 ${className}`}>
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

      {open && query && <SearchResults results={results} onSelect={handleSelect} />}
    </div>
  );
}

function SearchResults({ results, onSelect }) {
  return (
    <ul className="mt-2 max-h-64 overflow-auto rounded-xl border border-black/10 bg-white/95 py-1 shadow-cardHover backdrop-blur dark:border-white/10 dark:bg-neutral-900/95">
      {results.length ? (
        results.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              onClick={() => onSelect(member)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              {member.imageUrl ? (
                <img src={member.imageUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-black/10 dark:bg-white/10" />
              )}
              {member.name}
            </button>
          </li>
        ))
      ) : (
        <li className="px-3 py-2 text-sm text-ink-light/50 dark:text-ink-dark/50">No matches found.</li>
      )}
    </ul>
  );
}
