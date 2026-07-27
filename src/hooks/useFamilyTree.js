import { useCallback, useMemo } from 'react';
import { useFamilyTreeContext } from '../context/FamilyTreeContext.jsx';
import {
  createMember,
  updateMember,
  deleteMember,
  linkPartners,
  unlinkPartners,
  linkParentChild,
  unlinkParentChild,
} from '../services/memberService.js';

/**
 * Central hook for reading tree state and mutating it. Components should
 * prefer this over importing memberService directly, so relationship
 * bookkeeping (which member list to re-derive from, etc.) stays in one
 * place.
 */
export function useFamilyTree() {
  const {
    familyId,
    family,
    members,
    loading,
    notFound,
    isAdmin,
    focusedPersonId,
    focusedNodeId,
    focusPerson,
    clearFocus,
    canEdit,
    refreshMembers,
  } = useFamilyTreeContext();

  const membersById = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const getMember = useCallback((id) => membersById.get(id) || null, [membersById]);

  const searchMembers = useCallback(
    (queryText) => {
      const q = queryText.trim().toLowerCase();
      if (!q) return [];
      return members.filter((m) => m.name?.toLowerCase().includes(q));
    },
    [members]
  );

  const addMember = useCallback(
    async (data) => {
      const createdId = await createMember(familyId, data);
      await refreshMembers();
      return createdId;
    },
    [familyId, refreshMembers]
  );

  const editMember = useCallback(
    async (memberId, data) => {
      await updateMember(familyId, memberId, data);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  const removeMember = useCallback(
    async (memberId) => {
      await deleteMember(familyId, memberId);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  const addPartnerLink = useCallback(
    async (idA, idB) => {
      await linkPartners(familyId, idA, idB);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  const removePartnerLink = useCallback(
    async (idA, idB) => {
      await unlinkPartners(familyId, idA, idB);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  const addParentChildLink = useCallback(
    async (parentId, childId, secondaryParentId = null) => {
      await linkParentChild(familyId, parentId, childId, secondaryParentId);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  const removeParentChildLink = useCallback(
    async (parentId, childId) => {
      await unlinkParentChild(familyId, parentId, childId);
      await refreshMembers();
    },
    [familyId, refreshMembers]
  );

  return {
    familyId,
    family,
    members,
    membersById,
    loading,
    notFound,
    isAdmin,
    canEdit,
    focusedPersonId,
    focusedNodeId,
    focusPerson,
    clearFocus,
    getMember,
    searchMembers,
    addMember,
    editMember,
    removeMember,
    addPartnerLink,
    removePartnerLink,
    addParentChildLink,
    removeParentChildLink,
  };
}
