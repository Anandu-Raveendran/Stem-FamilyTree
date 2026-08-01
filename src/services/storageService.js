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

export async function createCroppedImageFile(file, crop = null, options = {}) {
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

  const outputSize = options.outputSize || 1200;
  const maxDimension = options.maxDimension || 1600;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const renderWidth = Math.max(1, Math.round(img.width * scale));
  const renderHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const cropConfig = crop || { x: 0.5, y: 0.5, size: 1 };
  const baseSide = Math.min(img.width, img.height);
  const cropSize = Math.max(1, Math.round(baseSide / Math.max(cropConfig.size || 1, 0.0001)));
  const centerX = img.width / 2 + (cropConfig.x - 0.5) * (img.width - cropSize);
  const centerY = img.height / 2 + (cropConfig.y - 0.5) * (img.height - cropSize);
  const sx = Math.max(0, Math.min(img.width - cropSize, centerX - cropSize / 2));
  const sy = Math.max(0, Math.min(img.height - cropSize, centerY - cropSize / 2));

  const sourceWidth = Math.min(img.width - sx, cropSize);
  const sourceHeight = Math.min(img.height - sy, cropSize);
  context.drawImage(img, sx, sy, sourceWidth, sourceHeight, 0, 0, outputSize, outputSize);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

async function optimizeImageFile(file, crop = null) {
  return createCroppedImageFile(file, crop);
}

/**
 * Uploads a profile image file for a given family member and returns its
 * public download URL.
 * @param {string} familyId
 * @param {string} memberId
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function uploadMemberImage(familyId, memberId, file, crop = null) {
  const optimizedFile = await optimizeImageFile(file, crop);
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
export async function copyMemberImageToFamily(targetFamilyId, memberId, imageUrl) {
  if (!imageUrl || imageUrl.startsWith(PLACEHOLDER_IMAGE)) return imageUrl;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`);
    const blob = await response.blob();
    const rawName = imageUrl.split('?')[0].split('/').pop() || `${memberId}.jpg`;
    const safeName = rawName || `${memberId}.jpg`;
    const path = `families/${targetFamilyId}/members/${memberId}/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    return getDownloadURL(storageRef);
  } catch (err) {
    // Non-fatal: the original image may be unavailable or already missing.
    // eslint-disable-next-line no-console
    console.warn('Could not copy member image to the new tree:', err.message);
    return imageUrl;
  }
}

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
