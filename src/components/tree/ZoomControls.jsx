import React from 'react';
import { Plus, Minus, Maximize2 } from 'lucide-react';

export default function ZoomControls({ onZoomIn, onZoomOut, onRecenter }) {
  const btnClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/90 text-ink-light shadow-card backdrop-blur transition hover:bg-white active:scale-95 dark:border-white/10 dark:bg-neutral-900/90 dark:text-ink-dark dark:hover:bg-neutral-900';

  return (
    <div className="pointer-events-auto fixed bottom-6 right-6 z-30 flex flex-col gap-2">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={btnClass}>
        <Plus className="h-4 w-4" />
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={btnClass}>
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Fit tree to view"
        className={btnClass}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
