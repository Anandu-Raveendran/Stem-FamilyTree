import {
  createMember,
  updateMember,
  deleteMember,
  linkPartners,
  unlinkPartners,
  linkParentChild,
  unlinkParentChild,
} from '../services/memberService.js';
import { uploadMemberImage, deleteMemberImage } from '../services/storageService.js';

const isLocalUrl = (url) => url?.startsWith('blob:');

/** Commits one semantic operation. It deliberately contains no React state. */
export async function commitTreeOperation(familyId, operation) {
  switch (operation.type) {
    case 'member.create': {
      const remoteMember = {
        ...operation.member,
        imageUrl: isLocalUrl(operation.member.imageUrl) ? '' : operation.member.imageUrl,
      };
      await createMember(familyId, remoteMember, operation.member.id);
      return { ...operation, member: remoteMember };
    }
    case 'member.update':
      await updateMember(familyId, operation.memberId, operation.patch);
      return operation;
    case 'member.delete':
      await deleteMember(familyId, operation.memberId);
      return operation;
    case 'partner.link':
      await linkPartners(familyId, operation.memberIdA, operation.memberIdB);
      return operation;
    case 'partner.unlink':
      await unlinkPartners(familyId, operation.memberIdA, operation.memberIdB);
      return operation;
    case 'parentChild.link':
      await linkParentChild(familyId, operation.parentId, operation.childId, operation.secondaryParentId);
      return operation;
    case 'parentChild.unlink':
      await unlinkParentChild(familyId, operation.parentId, operation.childId);
      return operation;
    case 'member.image': {
      const imageUrl = await uploadMemberImage(
        familyId,
        operation.memberId,
        operation.file
      );
      const committed = {
        type: 'member.update',
        memberId: operation.memberId,
        patch: { imageUrl },
      };
      await updateMember(familyId, committed.memberId, committed.patch);
      if (operation.previousImageUrl) {
        await deleteMemberImage(operation.previousImageUrl);
      }
      return committed;
    }
    default:
      throw new Error(`Unsupported sync operation: ${operation.type}`);
  }
}

export function isTemporarySyncError(error) {
  return [
    'unavailable',
    'deadline-exceeded',
    'network-request-failed',
    'resource-exhausted',
  ].some((code) => error?.code?.includes(code));
}
