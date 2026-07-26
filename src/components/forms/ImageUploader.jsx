import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { getPlaceholderImage } from '../../services/storageService.js';

/**
 * Lets the user pick a local image file. It does not upload immediately -
 * it hands the raw File back to the parent form via `onFileSelected` so the
 * caller can decide when to actually push it to Storage (e.g. only once the
 * member document exists and has an id to namespace the upload path).
 */
export default function ImageUploader({ previewSeed, currentUrl, onFileSelected, uploading }) {
  const inputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPreview(URL.createObjectURL(file));
    onFileSelected?.(file);
  };

  const displaySrc =
    localPreview || currentUrl || getPlaceholderImage(previewSeed || 'new-member');

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <img
          src={displaySrc}
          alt="Profile preview"
          className="h-16 w-16 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10"
        />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          Choose photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <p className="mt-1 text-xs text-ink-light/50 dark:text-ink-dark/50">
          PNG or JPG, square photos look best.
        </p>
      </div>
    </div>
  );
}
