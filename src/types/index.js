/**
 * @typedef {Object} Family
 * @property {string} id - slugified family tree id, e.g. "smith-family"
 * @property {string} name - display name, e.g. "Smith Family Tree"
 * @property {string} ownerId - Firebase Auth UID of the creator
 * @property {string[]} adminEmails - lowercase emails with edit rights
 * @property {string[]} pendingRequests - email addresses or IDs of users requesting admin access
 * @property {import('firebase/firestore').Timestamp} createdAt
 */

/**
 * @typedef {Object} ChildDetail
 * @property {string} childId
 * @property {string|null} secondaryParentId
 */

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 * @property {string} imageUrl
 * @property {string} job
 * @property {string} location
 * @property {string} houseName
 * @property {string} dateOfBirth - YYYY-MM-DD
 * @property {string|null} dateOfDeath - YYYY-MM-DD or null
 * @property {string[]} parentIds
 * @property {ChildDetail[]} childrenDetails
 * @property {string[]} partnerIds
 * @property {number} generation
 */

/**
 * @typedef {Object} TreeNode
 * @property {string} nodeId - unique id for this rendered node (couple or single)
 * @property {Member[]} members - one member for a single node, two for a couple
 * @property {number} generation
 * @property {TreeNode[]} children
 */

export {};
