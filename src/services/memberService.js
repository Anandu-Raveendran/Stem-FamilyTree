/**
 * Isolated Firestore service layer for `families/{familyId}/members`.
 *
 * All relationship mutations (parent-child links, partner links, deletes)
 * go through Firestore transactions or batched writes so that every
 * affected document is updated atomically and bidirectionally. Nothing in
 * this file leaves the graph in a half-updated state.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { deleteMemberImage } from './storageService.js';

const membersCol = (familyId) => collection(db, 'families', familyId, 'members');
const memberDoc = (familyId, memberId) =>
  doc(db, 'families', familyId, 'members', memberId);

const emptyMember = () => ({
  name: '',
  email: '',
  phone: '',
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
});

/** Subscribes to real-time updates for every member in a family. */
export function subscribeToMembers(familyId, callback) {
  return onSnapshot(membersCol(familyId), (snap) => {
    const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(members);
  });
}

/** One-off fetch of every member in a family. */
export async function getMembers(familyId) {
  const snap = await getDocs(membersCol(familyId));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Creates a new member document (with no relationships yet - use
 * `linkPartners` / `linkParentChild` afterward so every link stays
 * bidirectional and transactional).
 * @returns {Promise<string>} new member id
 */
export async function createMember(familyId, data, memberId = null) {
  const ref = memberId ? memberDoc(familyId, memberId) : doc(membersCol(familyId));
  await runTransaction(db, async (tx) => {
    tx.set(ref, {
      ...emptyMember(),
      ...data,
      id: ref.id,
      createdAt: serverTimestamp(),
    });
  });
  return ref.id;
}

/** Updates non-relationship fields (name, photo, job, dates, etc). */
export async function updateMember(familyId, memberId, data) {
  const ref = memberDoc(familyId, memberId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Member not found.');
    tx.update(ref, data);
  });
}

/**
 * Links two members as partners, bidirectionally, in a single transaction.
 * Refuses to link a member to themselves.
 */
export async function linkPartners(familyId, memberIdA, memberIdB) {
  if (memberIdA === memberIdB) {
    throw new Error('A person cannot be their own partner.');
  }
  const refA = memberDoc(familyId, memberIdA);
  const refB = memberDoc(familyId, memberIdB);

  await runTransaction(db, async (tx) => {
    const [snapA, snapB] = await Promise.all([tx.get(refA), tx.get(refB)]);
    if (!snapA.exists() || !snapB.exists()) {
      throw new Error('One or both members do not exist.');
    }
    const dataA = snapA.data();
    const dataB = snapB.data();

    const partnersA = new Set(dataA.partnerIds || []);
    const partnersB = new Set(dataB.partnerIds || []);
    partnersA.add(memberIdB);
    partnersB.add(memberIdA);

    tx.update(refA, { partnerIds: Array.from(partnersA) });
    tx.update(refB, { partnerIds: Array.from(partnersB) });
  });
}

/** Removes a partner link bidirectionally. */
export async function unlinkPartners(familyId, memberIdA, memberIdB) {
  const refA = memberDoc(familyId, memberIdA);
  const refB = memberDoc(familyId, memberIdB);

  await runTransaction(db, async (tx) => {
    const [snapA, snapB] = await Promise.all([tx.get(refA), tx.get(refB)]);
    if (!snapA.exists() || !snapB.exists()) return;
    const dataA = snapA.data();
    const dataB = snapB.data();

    tx.update(refA, {
      partnerIds: (dataA.partnerIds || []).filter((id) => id !== memberIdB),
    });
    tx.update(refB, {
      partnerIds: (dataB.partnerIds || []).filter((id) => id !== memberIdA),
    });
  });
}

/**
 * Links a child to one or two parents, bidirectionally, in a single
 * transaction. `secondaryParentId` is optional (null for a single-parent
 * child). Prevents self-parenting and duplicate links.
 */
export async function linkParentChild(
  familyId,
  parentId,
  childId,
  secondaryParentId = null
) {
  if (parentId === childId || secondaryParentId === childId) {
    throw new Error('A person cannot be their own parent or child.');
  }

  const parentRef = memberDoc(familyId, parentId);
  const childRef = memberDoc(familyId, childId);
  const secondaryRef = secondaryParentId
    ? memberDoc(familyId, secondaryParentId)
    : null;

  await runTransaction(db, async (tx) => {
    const [parentSnap, childSnap, secondarySnap] = await Promise.all([
      tx.get(parentRef),
      tx.get(childRef),
      secondaryRef ? tx.get(secondaryRef) : Promise.resolve(null),
    ]);

    if (!parentSnap.exists() || !childSnap.exists()) {
      throw new Error('Parent or child member does not exist.');
    }
    if (secondaryRef && !secondarySnap.exists()) {
      throw new Error('Secondary parent member does not exist.');
    }

    const parentData = parentSnap.data();
    const childData = childSnap.data();

    // Prevent a cycle: parent cannot already be a descendant of child.
    if ((parentData.parentIds || []).includes(childId)) {
      throw new Error('This link would create a circular relationship.');
    }

    const parentChildren = parentData.childrenDetails || [];
    const alreadyLinked = parentChildren.some((c) => c.childId === childId);
    const updatedChildren = alreadyLinked
      ? parentChildren.map((c) =>
          c.childId === childId ? { childId, secondaryParentId } : c
        )
      : [...parentChildren, { childId, secondaryParentId }];

    tx.update(parentRef, { childrenDetails: updatedChildren });

    const childParentIds = new Set(childData.parentIds || []);
    childParentIds.add(parentId);
    if (secondaryParentId) childParentIds.add(secondaryParentId);
    tx.update(childRef, { parentIds: Array.from(childParentIds) });

    if (secondaryRef) {
      const secondaryData = secondarySnap.data();
      const secondaryChildren = secondaryData.childrenDetails || [];
      const secondaryAlready = secondaryChildren.some(
        (c) => c.childId === childId
      );
      const updatedSecondaryChildren = secondaryAlready
        ? secondaryChildren.map((c) =>
            c.childId === childId ? { childId, secondaryParentId: parentId } : c
          )
        : [...secondaryChildren, { childId, secondaryParentId: parentId }];
      tx.update(secondaryRef, { childrenDetails: updatedSecondaryChildren });
    }
  });
}

/** Removes a parent-child link bidirectionally (both parent slots). */
export async function unlinkParentChild(familyId, parentId, childId) {
  const parentRef = memberDoc(familyId, parentId);
  const childRef = memberDoc(familyId, childId);

  await runTransaction(db, async (tx) => {
    const [parentSnap, childSnap] = await Promise.all([
      tx.get(parentRef),
      tx.get(childRef),
    ]);
    if (!parentSnap.exists() || !childSnap.exists()) return;

    const parentData = parentSnap.data();
    const childData = childSnap.data();

    tx.update(parentRef, {
      childrenDetails: (parentData.childrenDetails || []).filter(
        (c) => c.childId !== childId
      ),
    });
    tx.update(childRef, {
      parentIds: (childData.parentIds || []).filter((id) => id !== parentId),
    });
  });
}

/** Reorders a child's position within each relevant parent's child list. */
export async function reorderParentChild(familyId, parentIds, childId, direction) {
  const parents = Array.from(new Set((parentIds || []).filter(Boolean)));
  if (!parents.length) return;

  await runTransaction(db, async (tx) => {
    const snapshots = await Promise.all(parents.map((parentId) => tx.get(memberDoc(familyId, parentId))));
    snapshots.forEach((snap, index) => {
      if (!snap.exists()) return;
      const parentData = snap.data();
      const current = parentData.childrenDetails || [];
      const currentIndex = current.findIndex((item) => item.childId === childId);
      if (currentIndex < 0) return;
      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return;
      const reordered = [...current];
      const [item] = reordered.splice(currentIndex, 1);
      reordered.splice(targetIndex, 0, item);
      tx.update(memberDoc(familyId, parents[index]), { childrenDetails: reordered });
    });
  });
}

/**
 * Deletes a member entirely: scrubs their id from every related member's
 * parentIds/partnerIds/childrenDetails and deletes their document in one
 * batch, then removes their Storage photo. Keeping the photo cleanup last
 * means a failed Firestore delete can be safely restored in the local UI.
 */
export async function deleteMember(familyId, memberId) {
  const targetRef = memberDoc(familyId, memberId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) return;
  const targetData = targetSnap.data();

  // 1. Gather every member that references this id.
  const allMembers = await getMembers(familyId);
  const batch = writeBatch(db);

  allMembers.forEach((m) => {
    if (m.id === memberId) return;
    let changed = false;
    const update = {};

    if ((m.parentIds || []).includes(memberId)) {
      update.parentIds = m.parentIds.filter((id) => id !== memberId);
      changed = true;
    }
    if ((m.partnerIds || []).includes(memberId)) {
      update.partnerIds = m.partnerIds.filter((id) => id !== memberId);
      changed = true;
    }
    const hasChildLink = (m.childrenDetails || []).some(
      (c) => c.childId === memberId || c.secondaryParentId === memberId
    );
    if (hasChildLink) {
      update.childrenDetails = m.childrenDetails
        .filter((c) => c.childId !== memberId)
        .map((c) =>
          c.secondaryParentId === memberId
            ? { ...c, secondaryParentId: null }
            : c
        );
      changed = true;
    }

    if (changed) {
      batch.update(memberDoc(familyId, m.id), update);
    }
  });

  // 2. Delete the member document itself.
  batch.delete(targetRef);

  await batch.commit();

  // 3. Storage is not part of the Firestore batch; its helper treats cleanup
  // failures as non-fatal, so a successfully deleted person stays deleted.
  await deleteMemberImage(targetData.imageUrl);
}

/**
 * Recomputes top-down generation numbers for the whole family (roots with
 * no parents = generation 0) and persists any changed values in one batch.
 * Pure graph logic lives in `computeGenerations` (hooks/useFamilyTree.js
 * re-exports it) so it can be unit tested without Firestore.
 */
export function computeGenerations(members) {
  const byId = new Map(members.map((m) => [m.id, m]));
  const generation = new Map();
  const roots = members.filter((m) => !(m.parentIds || []).length);

  const queue = roots.map((r) => ({ id: r.id, gen: 0 }));
  const visited = new Set();

  while (queue.length) {
    const { id, gen } = queue.shift();
    const current = generation.get(id);
    if (current !== undefined && current >= gen) continue;
    generation.set(id, gen);

    const member = byId.get(id);
    if (!member) continue;
    const key = `${id}:${gen}`;
    if (visited.has(key)) continue;
    visited.add(key);

    (member.childrenDetails || []).forEach((c) => {
      queue.push({ id: c.childId, gen: gen + 1 });
    });
  }

  // Anyone unreachable from a root (shouldn't normally happen) defaults to 0.
  members.forEach((m) => {
    if (!generation.has(m.id)) generation.set(m.id, 0);
  });

  return generation;
}

/** Persists freshly computed generation numbers for every changed member. */
export async function syncGenerations(familyId, members) {
  const generations = computeGenerations(members);
  const batch = writeBatch(db);
  let hasChanges = false;

  members.forEach((m) => {
    const newGen = generations.get(m.id) ?? 0;
    if (m.generation !== newGen) {
      batch.update(memberDoc(familyId, m.id), { generation: newGen });
      hasChanges = true;
    }
  });

  if (hasChanges) await batch.commit();
}
