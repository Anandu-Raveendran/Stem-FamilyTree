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

async function optimizeImageFile(file) {
  if (!file?.type?.startsWith('image/')) return file;

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to decode image file.'));
    image.src = dataUrl;
  });

  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82);
  });

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
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
  const optimizedFile = await optimizeImageFile(file);
  const path = `families/${familyId}/members/${memberId}/${Date.now()}-${optimizedFile.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, optimizedFile, {
    contentType: optimizedFile.type,
  });
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
