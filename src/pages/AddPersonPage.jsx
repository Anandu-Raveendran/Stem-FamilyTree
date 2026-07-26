import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PersonForm from '../components/forms/PersonForm.jsx';
import { useFamilyTree } from '../hooks/useFamilyTree.js';
import { useToast } from '../components/common/Toast.jsx';
import { uploadMemberImage } from '../services/storageService.js';

export default function AddPersonPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { familyId, members, isAdmin, addMember, editMember, addParentChildLink, addPartnerLink } =
    useFamilyTree();

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-ink-light/60 dark:text-ink-dark/60">
          You need edit access to add family members.
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

  const handleSubmit = async (data, { parentIds, partnerIds, imageFile }) => {
    const newId = await addMember(data);

    if (imageFile) {
      const imageUrl = await uploadMemberImage(familyId, newId, imageFile);
      await editMember(newId, { imageUrl });
    }

    if (parentIds.length) {
      const [parentA, parentB] = parentIds;
      await addParentChildLink(parentA, newId, parentB || null);
    }

    await Promise.all(partnerIds.map((pid) => addPartnerLink(newId, pid)));

    toast.success(`${data.name} was added to the tree.`);
    navigate(`/tree/${familyId}/person/${newId}`);
  };

  return (
    <div className="min-h-screen bg-canvas-light px-4 pb-10 pt-24 dark:bg-canvas-dark">
      <div className="mx-auto max-w-lg">
        <button
          type="button"
          onClick={() => navigate(`/tree/${familyId}`)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-light/60 hover:text-ink-light dark:text-ink-dark/60 dark:hover:text-ink-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tree
        </button>

        <h1 className="mb-6 font-display text-2xl font-semibold">
          Add a family member
        </h1>

        <PersonForm
          members={members}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/tree/${familyId}`)}
          submitLabel="Add to tree"
        />
      </div>
    </div>
  );
}
