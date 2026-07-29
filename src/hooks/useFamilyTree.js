import { useCallback, useMemo } from 'react';
import { useFamilyTreeContext } from '../context/FamilyTreeContext.jsx';

const emptyMember = (id, data) => ({
  id,
  name: '',
  imageUrl: '',
  job: '',
  location: '',
  houseName: '',
  dateOfBirth: '',
  dateOfDeath: null,
  parentIds: [],
  childrenDetails: [],
  partnerIds: [],
  generation: 0,
  ...data,
});

function newMemberId() {
  return globalThis.crypto?.randomUUID?.()
    || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function nextDummyName(members, baseName, relationship) {
  const prefix = `${baseName}'s ${relationship}`;
  const pattern = new RegExp(`^${escapeRegExp(prefix)}(?: (\\d+))?$`, 'i');
  const usedNumbers = new Set();

  members.forEach((member) => {
    const match = member.name?.trim().match(pattern);
    if (match) usedNumbers.add(match[1] ? Number(match[1]) : 1);
  });

  let number = 1;
  while (usedNumbers.has(number)) number += 1;
  return number === 1 ? prefix : `${prefix} ${number}`;
}

/** The component-facing command API. None of these commands wait for Firebase. */
export function useFamilyTree() {
  const tree = useFamilyTreeContext();
  const {
    members,
    enqueueOperation,
  } = tree;

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const getMember = useCallback((id) => membersById.get(id) || null, [membersById]);

  const searchMembers = useCallback((queryText) => {
    const query = queryText.trim().toLowerCase();
    return query ? members.filter((member) => member.name?.toLowerCase().includes(query)) : [];
  }, [members]);

  const addMember = useCallback((data) => {
    const id = newMemberId();
    enqueueOperation({ type: 'member.create', member: emptyMember(id, data) });
    return id;
  }, [enqueueOperation]);

  const editMember = useCallback((memberId, patch) => {
    enqueueOperation({
      type: 'member.update', memberId, patch,
      memberName: getMember(memberId)?.name,
    });
  }, [enqueueOperation, getMember]);

  const setMemberImage = useCallback((memberId, file, previousImageUrl = '', crop = null) => {
    const localImageUrl = URL.createObjectURL(file);
    enqueueOperation({
      type: 'member.image', memberId, file, crop,
      patch: { imageUrl: localImageUrl },
      previousImageUrl,
      memberName: getMember(memberId)?.name,
    });
  }, [enqueueOperation, getMember]);

  const removeMember = useCallback((memberId) => {
    enqueueOperation({
      type: 'member.delete', memberId,
      memberName: getMember(memberId)?.name,
    });
  }, [enqueueOperation, getMember]);

  const addPartnerLink = useCallback((memberIdA, memberIdB) => {
    enqueueOperation({ type: 'partner.link', memberIdA, memberIdB, memberName: getMember(memberIdA)?.name });
  }, [enqueueOperation, getMember]);
  const removePartnerLink = useCallback((memberIdA, memberIdB) => {
    enqueueOperation({ type: 'partner.unlink', memberIdA, memberIdB, memberName: getMember(memberIdA)?.name });
  }, [enqueueOperation, getMember]);
  const addParentChildLink = useCallback((parentId, childId, secondaryParentId = null) => {
    enqueueOperation({ type: 'parentChild.link', parentId, childId, secondaryParentId, memberName: getMember(childId)?.name });
  }, [enqueueOperation, getMember]);
  const removeParentChildLink = useCallback((parentId, childId) => {
    enqueueOperation({ type: 'parentChild.unlink', parentId, childId, memberName: getMember(childId)?.name });
  }, [enqueueOperation, getMember]);

  const addQuickChild = useCallback((parentIds) => {
    const parents = parentIds.map((id) => getMember(id)).filter(Boolean);
    if (!parents.length) return null;
    const baseName = parents.map((parent) => parent.name).join(' & ');
    const childId = addMember({ name: nextDummyName(members, baseName, 'child') });
    addParentChildLink(parents[0].id, childId, parents[1]?.id || null);
    return childId;
  }, [addMember, addParentChildLink, getMember, members]);

  const addQuickPartner = useCallback((memberId) => {
    const member = getMember(memberId);
    if (!member) return null;
    const partnerId = addMember({
      name: nextDummyName(members, member.name, 'partner'),
    });
    addPartnerLink(memberId, partnerId);
    return partnerId;
  }, [addMember, addPartnerLink, getMember, members]);

  return {
    ...tree,
    membersById,
    getMember,
    searchMembers,
    addMember,
    editMember,
    setMemberImage,
    removeMember,
    addPartnerLink,
    removePartnerLink,
    addParentChildLink,
    removeParentChildLink,
    addQuickChild,
    addQuickPartner,
  };
}
