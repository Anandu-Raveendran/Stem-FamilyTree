/**
 * Isolated Firebase Storage service layer for member profile images.
 */
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase.js';

const PLACEHOLDER_IMAGE =
  'https://api.dicebear.com/7.x/thumbs/svg?seed=';

/**
 * Returns a deterministic placeholder avatar for a member with no photo.
 * @param {string} seed - typically the member id or name
 */
export function getPlaceholderImage(seed) {
  return `${PLACEHOLDER_IMAGE}${encodeURIComponent(seed || 'member')}`;
}

/**
 * Uploads a profile image file for a given family member and returns its
 * public download URL.
 * @param {string} familyId
 * @param {string} memberId
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadMemberImage(familyId, memberId, file) {
  const path = `families/${familyId}/members/${memberId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

/**
 * Deletes a previously uploaded profile image, given its full download URL.
 * Silently no-ops for placeholder or empty URLs, since there is nothing to
 * remove from Storage in that case.
 * @param {string} imageUrl
 */
export async function deleteMemberImage(imageUrl) {
  if (!imageUrl || imageUrl.startsWith(PLACEHOLDER_IMAGE)) return;
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (err) {
    // Non-fatal: the file may already be gone, or the URL may not be a
    // Storage reference (e.g. an external placeholder). Log and continue.
    // eslint-disable-next-line no-console
    console.warn('Could not delete member image from Storage:', err.message);
  }
}
