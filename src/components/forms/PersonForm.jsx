import React, { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import ImageUploader from './ImageUploader.jsx';
import RelationshipPicker from './RelationshipPicker.jsx';

const emptyForm = {
  name: '',
  job: '',
  location: '',
  houseName: '',
  dateOfBirth: '',
  dateOfDeath: '',
};

/**
 * Shared create/edit form for a family member. Collects core details plus
 * up to two parents and any number of partners; the caller is responsible
 * for persisting the member and then calling the relationship-linking
 * service functions with the returned `parentIds` / `partnerIds`.
 */
export default function PersonForm({
  initialData,
  members,
  excludeId,
  onSubmit,
  onCancel,
  submitLabel = 'Save family member',
}) {
  const [form, setForm] = useState({ ...emptyForm, ...initialData });
  const [imageFile, setImageFile] = useState(null);
  const [parentIds, setParentIds] = useState(initialData?.parentIds || []);
  const [partnerIds, setPartnerIds] = useState(initialData?.partnerIds || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(
        {
          ...form,
          dateOfDeath: form.dateOfDeath || null,
        },
        { parentIds, partnerIds, imageFile }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <ImageUploader
        previewSeed={excludeId || form.name}
        currentUrl={initialData?.imageUrl}
        onFileSelected={setImageFile}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
          Full name *
        </label>
        <input
          value={form.name}
          onChange={update('name')}
          required
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
            Date of birth
          </label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={update('dateOfBirth')}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
            Date of death (if applicable)
          </label>
          <input
            type="date"
            value={form.dateOfDeath || ''}
            onChange={update('dateOfDeath')}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
            Occupation
          </label>
          <input
            value={form.job}
            onChange={update('job')}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
            Location
          </label>
          <input
            value={form.location}
            onChange={update('location')}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink-light/80 dark:text-ink-dark/80">
          House / family name
        </label>
        <input
          value={form.houseName}
          onChange={update('houseName')}
          className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
        />
      </div>

      <RelationshipPicker
        label="Parents (up to 2)"
        members={members}
        excludeId={excludeId}
        selectedIds={parentIds}
        onChange={setParentIds}
        max={2}
      />

      <RelationshipPicker
        label="Partners / spouses"
        members={members}
        excludeId={excludeId}
        selectedIds={partnerIds}
        onChange={setPartnerIds}
      />

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-card transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
