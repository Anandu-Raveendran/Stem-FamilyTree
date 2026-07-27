/**
 * Pure, local tree mutations. The UI uses these immediately while the same
 * semantic operation is later committed by the Firebase adapter.
 */
const copyMember = (member) => ({
  ...member,
  parentIds: [...(member.parentIds || [])],
  partnerIds: [...(member.partnerIds || [])],
  childrenDetails: (member.childrenDetails || []).map((child) => ({ ...child })),
});

export function applyTreeOperation(members, operation) {
  const byId = new Map(members.map((member) => [member.id, copyMember(member)]));
  const get = (id) => byId.get(id);

  switch (operation.type) {
    case 'member.create':
      byId.set(operation.member.id, copyMember(operation.member));
      break;
    case 'member.update': {
      const member = get(operation.memberId);
      if (member) Object.assign(member, operation.patch);
      break;
    }
    case 'member.image': {
      const member = get(operation.memberId);
      if (member) Object.assign(member, operation.patch);
      break;
    }
    case 'member.delete': {
      byId.delete(operation.memberId);
      byId.forEach((member) => {
        member.parentIds = member.parentIds.filter((id) => id !== operation.memberId);
        member.partnerIds = member.partnerIds.filter((id) => id !== operation.memberId);
        member.childrenDetails = member.childrenDetails
          .filter((child) => child.childId !== operation.memberId)
          .map((child) => child.secondaryParentId === operation.memberId
            ? { ...child, secondaryParentId: null }
            : child);
      });
      break;
    }
    case 'partner.link': {
      const a = get(operation.memberIdA);
      const b = get(operation.memberIdB);
      if (a && b) {
        a.partnerIds = Array.from(new Set([...a.partnerIds, b.id]));
        b.partnerIds = Array.from(new Set([...b.partnerIds, a.id]));
      }
      break;
    }
    case 'partner.unlink': {
      const a = get(operation.memberIdA);
      const b = get(operation.memberIdB);
      if (a) a.partnerIds = a.partnerIds.filter((id) => id !== operation.memberIdB);
      if (b) b.partnerIds = b.partnerIds.filter((id) => id !== operation.memberIdA);
      break;
    }
    case 'parentChild.link': {
      const parent = get(operation.parentId);
      const child = get(operation.childId);
      const secondary = operation.secondaryParentId ? get(operation.secondaryParentId) : null;
      if (parent && child) {
        const addChild = (member, secondaryParentId) => {
          const existing = member.childrenDetails.some((item) => item.childId === child.id);
          member.childrenDetails = existing
            ? member.childrenDetails.map((item) => item.childId === child.id
              ? { childId: child.id, secondaryParentId }
              : item)
            : [...member.childrenDetails, { childId: child.id, secondaryParentId }];
        };
        addChild(parent, operation.secondaryParentId || null);
        child.parentIds = Array.from(new Set([
          ...child.parentIds,
          parent.id,
          ...(secondary ? [secondary.id] : []),
        ]));
        if (secondary) addChild(secondary, parent.id);
      }
      break;
    }
    case 'parentChild.unlink': {
      const parent = get(operation.parentId);
      const child = get(operation.childId);
      if (parent) {
        parent.childrenDetails = parent.childrenDetails.filter(
          (item) => item.childId !== operation.childId
        );
      }
      if (child) child.parentIds = child.parentIds.filter((id) => id !== operation.parentId);
      break;
    }
    default:
      break;
  }

  return withGenerations(Array.from(byId.values()));
}

function withGenerations(members) {
  const byId = new Map(members.map((member) => [member.id, member]));
  const generation = new Map();
  const queue = members
    .filter((member) => !(member.parentIds || []).length)
    .map((member) => ({ id: member.id, value: 0 }));

  while (queue.length) {
    const { id, value } = queue.shift();
    if ((generation.get(id) ?? -1) >= value) continue;
    generation.set(id, value);
    (byId.get(id)?.childrenDetails || []).forEach(({ childId }) => {
      queue.push({ id: childId, value: value + 1 });
    });
  }

  return members.map((member) => ({
    ...member,
    generation: generation.get(member.id) ?? 0,
  }));
}
