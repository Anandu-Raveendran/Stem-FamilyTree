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
    (data) => createMember(familyId, data),
    [familyId]
  );

  const editMember = useCallback(
    (memberId, data) => updateMember(familyId, memberId, data),
    [familyId]
  );

  const removeMember = useCallback(
    (memberId) => deleteMember(familyId, memberId),
    [familyId]
  );

  const addPartnerLink = useCallback(
    (idA, idB) => linkPartners(familyId, idA, idB),
    [familyId]
  );

  const removePartnerLink = useCallback(
    (idA, idB) => unlinkPartners(familyId, idA, idB),
    [familyId]
  );

  const addParentChildLink = useCallback(
    (parentId, childId, secondaryParentId = null) =>
      linkParentChild(familyId, parentId, childId, secondaryParentId),
    [familyId]
  );

  const removeParentChildLink = useCallback(
    (parentId, childId) => unlinkParentChild(familyId, parentId, childId),
    [familyId]
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
