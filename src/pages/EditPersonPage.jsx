import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import PersonForm from '../components/forms/PersonForm.jsx';
import Modal from '../components/common/Modal.jsx';
import { useFamilyTree } from '../hooks/useFamilyTree.js';
import { useToast } from '../components/common/Toast.jsx';

export default function EditPersonPage() {
  const navigate = useNavigate();
  const { personId } = useParams();
  const toast = useToast();
  const {
    familyId,
    members,
    canEdit,
    getMember,
    editMember,
    setMemberImage,
    removeMember,
    addParentChildLink,
    removeParentChildLink,
    addPartnerLink,
    removePartnerLink,
  } = useFamilyTree();

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const member = getMember(personId);

  if (!canEdit) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-light/60 dark:text-ink-dark/60">
          You need edit access to change family members.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/tree/${familyId}`)}
          className="text-sm font-medium text-accent underline"
        >
          Back to the tree
        </button>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-light/60 dark:text-ink-dark/60">
          This person couldn&apos;t be found - they may have been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/tree/${familyId}`)}
          className="text-sm font-medium text-accent underline"
        >
          Back to the tree
        </button>
      </div>
    );
  }

  const handleSubmit = (data, { parentIds, partnerIds, imageFile }) => {
    if (imageFile) {
      setMemberImage(member.id, imageFile, member.imageUrl);
    }

    editMember(member.id, data);

    // Diff parents: remove ones no longer selected, add newly selected ones.
    const previousParents = member.parentIds || [];
    const removedParents = previousParents.filter((id) => !parentIds.includes(id));
    const addedParents = parentIds.filter((id) => !previousParents.includes(id));

    removedParents.forEach((pid) => removeParentChildLink(pid, member.id));
    if (addedParents.length) {
      const [parentA, parentB] = parentIds;
      addParentChildLink(parentA, member.id, parentB || null);
    }

    // Diff partners.
    const previousPartners = member.partnerIds || [];
    const removedPartners = previousPartners.filter((id) => !partnerIds.includes(id));
    const addedPartners = partnerIds.filter((id) => !previousPartners.includes(id));

    removedPartners.forEach((pid) => removePartnerLink(member.id, pid));
    addedPartners.forEach((pid) => addPartnerLink(member.id, pid));

    toast.success(`${data.name}'s details were updated.`);
    navigate(`/tree/${familyId}/person/${member.id}`);
  };

  const handleDelete = () => {
    removeMember(member.id);
    toast.success(`${member.name} was removed from the tree.`);
    navigate(`/tree/${familyId}`);
    setConfirmingDelete(false);
  };

  return (
    <div className="min-h-screen bg-canvas-light px-4 pb-10 pt-24 dark:bg-canvas-dark">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/tree/${familyId}/person/${member.id}`)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-light/60 hover:text-ink-light dark:text-ink-dark/60 dark:hover:text-ink-dark"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to tree
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>

        <h1 className="mb-6 font-display text-2xl font-semibold">
          Edit {member.name}
        </h1>

        <PersonForm
          initialData={member}
          members={members}
          excludeId={member.id}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/tree/${familyId}/person/${member.id}`)}
          submitLabel="Save changes"
        />
      </div>

      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title={`Remove ${member.name}?`}
      >
        <p className="mb-4 text-sm text-ink-light/70 dark:text-ink-dark/70">
          This deletes their photo and profile, and unlinks them from every
          parent, partner, and child in the tree. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            Yes, remove them
          </button>
        </div>
      </Modal>
    </div>
  );
}
