import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { subscribeToFamily, isFamilyAdmin } from '../services/familyService.js';
import { subscribeToMembers } from '../services/memberService.js';
import { useAuthContext } from './AuthContext.jsx';
import { allowPublicEdit } from '../config/siteConfig.js';
import { applyTreeOperation } from '../domain/treeOperations.js';
import { commitTreeOperation, isTemporarySyncError } from '../sync/firebaseTreeSync.js';
import { useToast } from '../components/common/Toast.jsx';

const FamilyTreeContext = createContext(null);
const RETRY_LIMIT = 3;

function operationId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function dependsOnMember(operation, memberId) {
  return [
    operation.memberId,
    operation.memberIdA,
    operation.memberIdB,
    operation.parentId,
    operation.childId,
    operation.secondaryParentId,
  ].includes(memberId);
}

function syncFailureMessage(operation) {
  const name = operation.member?.name || operation.memberName || 'This person';
  if (operation.type === 'member.create') return `${name} didn't save and was removed.`;
  if (operation.type === 'member.delete') return `${name} wasn't removed. The person was restored.`;
  return `Changes to ${name} didn't save.`;
}

function operationMemberIds(operation) {
  if (operation.type === 'member.create') return [operation.member.id];
  return [
    operation.memberId,
    operation.memberIdA,
    operation.memberIdB,
    operation.parentId,
    operation.childId,
    operation.secondaryParentId,
  ].filter(Boolean);
}

/**
 * The local tree is the UI source of truth. Firebase snapshots are the remote
 * base state; pending semantic operations are overlaid on top until committed.
 */
export function FamilyTreeProvider({ familyId, children }) {
  const { user } = useAuthContext();
  const toast = useToast();
  const [family, setFamily] = useState(null);
  const [remoteMembers, setRemoteMembers] = useState([]);
  const [pendingOperations, setPendingOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [focusedPersonId, setFocusedPersonId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const syncRunning = useRef(false);
  const activeFamilyId = useRef(familyId);
  activeFamilyId.current = familyId;

  const members = useMemo(
    () => pendingOperations.reduce(
      (current, operation) => applyTreeOperation(current, operation),
      remoteMembers
    ),
    [remoteMembers, pendingOperations]
  );
  const syncingMemberIds = useMemo(
    () => Array.from(new Set(pendingOperations.flatMap(operationMemberIds))),
    [pendingOperations]
  );

  useEffect(() => {
    if (!familyId) return undefined;
    setLoading(true);
    setNotFound(false);
    setRemoteMembers([]);
    setPendingOperations([]);

    const unsubFamily = subscribeToFamily(familyId, (data) => {
      setFamily(data);
      if (!data) setNotFound(true);
      setLoading(false);
    });
    const unsubMembers = subscribeToMembers(familyId, setRemoteMembers);

    return () => {
      unsubFamily();
      unsubMembers();
    };
  }, [familyId]);

  const enqueueOperation = useCallback((operation) => {
    setPendingOperations((current) => [
      ...current,
      { ...operation, id: operationId(), attempts: 0 },
    ]);
  }, []);

  // One operation at a time keeps relationship transactions ordered and makes
  // a slow Firebase connection entirely invisible to the editing flow.
  const operation = pendingOperations[0];
  useEffect(() => {
    if (!familyId || !operation || syncRunning.current) return undefined;

    syncRunning.current = true;

    const run = async () => {
      try {
        const committedOperation = await commitTreeOperation(familyId, operation);
        // Do not let a request from a previously viewed tree mutate the next
        // tree after navigation.
        if (activeFamilyId.current !== familyId) return;
        setRemoteMembers((current) => applyTreeOperation(current, committedOperation));
        setPendingOperations((current) => current.filter((item) => item.id !== operation.id));
      } catch (error) {
        if (activeFamilyId.current !== familyId) return;
        if (isTemporarySyncError(error) && operation.attempts < RETRY_LIMIT) {
          const delay = 1000 * (2 ** operation.attempts);
          window.setTimeout(() => {
            setPendingOperations((current) => current.map((item) => item.id === operation.id
              ? { ...item, attempts: item.attempts + 1 }
              : item));
          }, delay);
          return;
        }

        setPendingOperations((current) => {
          const remaining = current.filter((item) => item.id !== operation.id);
          // A failed creation also invalidates its queued image/relationship work.
          return operation.type === 'member.create'
            ? remaining.filter((item) => !dependsOnMember(item, operation.member.id))
            : remaining;
        });
        toast.error(syncFailureMessage(operation));
      } finally {
        syncRunning.current = false;
      }
    };

    run();
    // Deliberately no cleanup: React Strict Mode replays effects in development.
    // `syncRunning` ensures the operation is launched once, and allowing that
    // first launch to finish keeps the in-memory queue from getting stranded.
    return undefined;
  }, [familyId, operation?.id, operation?.attempts, toast]);

  const isAdmin = useMemo(() => isFamilyAdmin(family, user), [family, user]);
  const canEdit = useMemo(() => isAdmin || allowPublicEdit, [isAdmin]);

  const focusPerson = useCallback((personId, nodeId = null) => {
    setFocusedPersonId(personId);
    setFocusedNodeId(nodeId);
  }, []);
  const clearFocus = useCallback(() => {
    setFocusedPersonId(null);
    setFocusedNodeId(null);
  }, []);

  const value = useMemo(() => ({
    familyId,
    family,
    members,
    loading,
    notFound,
    isAdmin,
    canEdit,
    pendingSyncCount: pendingOperations.length,
    syncingMemberIds,
    enqueueOperation,
    focusedPersonId,
    focusedNodeId,
    focusPerson,
    clearFocus,
  }), [
    familyId, family, members, loading, notFound, isAdmin, canEdit,
    pendingOperations.length, syncingMemberIds, enqueueOperation, focusedPersonId, focusedNodeId,
    focusPerson, clearFocus,
  ]);

  return <FamilyTreeContext.Provider value={value}>{children}</FamilyTreeContext.Provider>;
}

export function useFamilyTreeContext() {
  const ctx = useContext(FamilyTreeContext);
  if (!ctx) throw new Error('useFamilyTreeContext must be used within a FamilyTreeProvider');
  return ctx;
}
