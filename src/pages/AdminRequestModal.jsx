import React, { useState } from 'react';
import { Check, Trash2, X as XIcon, UserCog } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import { useFamilyTree } from '../hooks/useFamilyTree.js';
import { useToast } from '../components/common/Toast.jsx';
import {
  approveAdminRequest,
  rejectAdminRequest,
  addAdminEmail,
  removeAdminEmail,
  getPendingRequestDisplayValue,
} from '../services/familyService.js';

/**
 * Drawer/modal for family owners and admins: approve or reject pending
 * "request edit access" submissions, and manually grant or revoke admin
 * emails. Firestore security rules are the real enforcement layer; this UI
 * only appears for users the client already believes are admins.
 */
export default function AdminRequestModal({ open, onClose }) {
  const { familyId, family } = useFamilyTree();
  const toast = useToast();
  const [manualEmail, setManualEmail] = useState('');
  const [busyId, setBusyId] = useState(null);

  if (!family) return null;

  const pending = family.pendingRequests || [];
  const admins = family.adminEmails || [];

  const handleApprove = async (requestValue) => {
    setBusyId(requestValue);
    try {
      await approveAdminRequest(familyId, requestValue, requestValue);
      toast.success('Access granted.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (requestValue) => {
    setBusyId(requestValue);
    try {
      await rejectAdminRequest(familyId, requestValue);
      toast.info('Request dismissed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    try {
      await addAdminEmail(familyId, manualEmail.trim());
      toast.success(`${manualEmail} can now edit this tree.`);
      setManualEmail('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveEmail = async (email) => {
    try {
      await removeAdminEmail(familyId, email);
      toast.info(`Removed ${email}'s edit access.`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Admin panel" wide>
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <UserCog className="h-4 w-4" /> Pending requests
          </h3>
          {pending.length === 0 ? (
            <p className="text-sm text-ink-light/50 dark:text-ink-dark/50">
              No pending requests right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {pending.map((request) => {
                const requestValue = getPendingRequestDisplayValue(request);
                const requestKey = requestValue || request;

                return (
                  <li
                    key={requestKey}
                    className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                  >
                    <span className="truncate font-mono text-xs">{requestValue}</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === requestKey}
                        onClick={() => handleApprove(requestValue)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300"
                        aria-label="Approve"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busyId === requestKey}
                        onClick={() => handleReject(requestValue)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                        aria-label="Reject"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Admins</h3>
          <ul className="mb-3 flex flex-col gap-1.5">
            {admins.map((email) => (
              <li
                key={email}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-1.5 text-sm dark:border-white/10"
              >
                {email}
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  aria-label={`Remove ${email}`}
                  className="text-ink-light/40 hover:text-red-600 dark:text-ink-dark/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddEmail} className="flex gap-2">
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="Add admin by email…"
              className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
            >
              Add
            </button>
          </form>
        </section>
      </div>
    </Modal>
  );
}
