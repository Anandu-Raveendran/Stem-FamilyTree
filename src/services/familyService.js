/**
 * Isolated Firestore service layer for the `families/{familyId}` collection.
 * No component should import `firebase/firestore` directly - everything
 * goes through this module (and `memberService.js` for the members
 * subcollection).
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { getMembers, copyMembersToFamily, deleteMembersFromFamily } from './memberService.js';
import { prepareSubtreeForCopy } from '../domain/treeOperations.js';

const familiesCol = () => collection(db, 'families');
const familyDoc = (familyId) => doc(db, 'families', familyId);

/** Slugifies a family name into a Firestore-safe document id. */
export function slugifyFamilyName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Creates a new family tree document. Throws if the slug is already taken.
 * @param {{ name: string, ownerId: string, ownerEmail: string }} params
 * @returns {Promise<string>} the new family id
 */
export async function createFamily({ name, ownerId, ownerEmail }) {
  const id = slugifyFamilyName(name);
  const ref = familyDoc(id);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    throw new Error(
      `A family tree named "${name}" already exists. Choose a different name.`
    );
  }
  await setDoc(ref, {
    id,
    name,
    ownerId,
    adminEmails: ownerEmail ? [ownerEmail.toLowerCase()] : [],
    pendingRequests: [],
    createdAt: serverTimestamp(),
  });
  return id;
}

/** Fetches a single family document (one-off read). */
export async function getFamily(familyId) {
  const snap = await getDoc(familyDoc(familyId));
  return snap.exists() ? snap.data() : null;
}

export async function createFamilyFromSubtree({
  name,
  ownerId,
  ownerEmail,
  sourceFamilyId,
  rootMemberIds,
  deleteSourceMembers = false,
}) {
  const newFamilyId = await createFamily({ name, ownerId, ownerEmail });
  const members = await getMembers(sourceFamilyId);
  const subtreeMembers = prepareSubtreeForCopy(members, rootMemberIds);

  if (!subtreeMembers.length) {
    throw new Error('That node has no members to move into a new tree.');
  }

  await copyMembersToFamily({
    targetFamilyId: newFamilyId,
    members: subtreeMembers,
  });

  if (deleteSourceMembers) {
    await deleteMembersFromFamily(sourceFamilyId, subtreeMembers.map((member) => member.id));
  }

  return newFamilyId;
}

/** Subscribes to real-time updates on a family document. */
export function subscribeToFamily(familyId, callback) {
  return onSnapshot(familyDoc(familyId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/** Lists all families where the given uid is the owner or an admin email. */
export async function listAccessibleFamilies(uid, email) {
  const ownedQuery = query(familiesCol(), where('ownerId', '==', uid));
  const ownedSnap = await getDocs(ownedQuery);
  const owned = ownedSnap.docs.map((d) => d.data());

  if (!email) return owned;

  const adminQuery = query(
    familiesCol(),
    where('adminEmails', 'array-contains', email.toLowerCase())
  );
  const adminSnap = await getDocs(adminQuery);
  const admin = adminSnap.docs.map((d) => d.data());

  const merged = new Map();
  [...owned, ...admin].forEach((f) => merged.set(f.id, f));
  return Array.from(merged.values());
}

/** Determines whether a user has edit rights on a family. */
export function isFamilyAdmin(family, user) {
  if (!family || !user) return false;
  if (family.ownerId === user.uid) return true;
  const email = (user.email || '').toLowerCase();
  return (family.adminEmails || []).includes(email);
}

export function normalizePendingRequestValue(value, fallbackValue = '') {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }

  if (value && typeof value === 'object') {
    const email = (value.email || '').trim().toLowerCase();
    if (email) return email;
    const uid = (value.uid || '').trim().toLowerCase();
    return uid;
  }

  return (fallbackValue || '').trim().toLowerCase();
}

export function getPendingRequestDisplayValue(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    return (value.email || value.uid || '').trim();
  }

  return '';
}

/** Adds the current user's email to the family's pendingRequests list. */
export function requestAdminAccess(familyId, uid, email) {
  const requestValue = normalizePendingRequestValue(email || uid, email || uid);

  return setDoc(
    familyDoc(familyId),
    { pendingRequests: arrayUnion(requestValue) },
    { merge: true }
  );
}

/**
 * Approves a pending request: removes the request value from pendingRequests and
 * adds their email to adminEmails.
 */
export function approveAdminRequest(familyId, uid, email) {
  const normalizedEmail = normalizePendingRequestValue(email || uid, email || uid);

  return setDoc(
    familyDoc(familyId),
    {
      pendingRequests: arrayRemove(normalizedEmail),
      adminEmails: arrayUnion(normalizedEmail),
    },
    { merge: true }
  );
}

/** Rejects a pending request without granting access. */
export function rejectAdminRequest(familyId, uid) {
  const requestValue = normalizePendingRequestValue(uid, uid);

  return setDoc(
    familyDoc(familyId),
    { pendingRequests: arrayRemove(requestValue) },
    { merge: true }
  );
}

/** Manually grants admin rights to an email address (owner-only action, enforced by Firestore rules). */
export function addAdminEmail(familyId, email) {
  return setDoc(
    familyDoc(familyId),
    { adminEmails: arrayUnion(email.toLowerCase()) },
    { merge: true }
  );
}

/** Revokes admin rights from an email address. */
export function removeAdminEmail(familyId, email) {
  return setDoc(
    familyDoc(familyId),
    { adminEmails: arrayRemove(email.toLowerCase()) },
    { merge: true }
  );
}
