import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { subscribeToFamily, isFamilyAdmin } from '../services/familyService.js';
import { getMembers, subscribeToMembers, syncGenerations } from '../services/memberService.js';
import { useAuthContext } from './AuthContext.jsx';
import { allowPublicEdit } from '../config/siteConfig.js';

const FamilyTreeContext = createContext(null);

/**
 * Provides live `family` and `members` data for one family tree, scoped by
 * `familyId`. Wrap any page that needs tree data in this provider.
 */
export function FamilyTreeProvider({ familyId, children }) {
  const { user } = useAuthContext();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [focusedPersonId, setFocusedPersonId] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);

  const refreshMembers = useCallback(async () => {
    if (!familyId) {
      setMembers([]);
      return;
    }

    try {
      const freshMembers = await getMembers(familyId);
      setMembers(freshMembers);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Failed to refresh members:', err.message);
    }
  }, [familyId]);

  useEffect(() => {
    if (!familyId) return undefined;
    setLoading(true);
    setNotFound(false);
    setMembers([]);

    const unsubFamily = subscribeToFamily(familyId, (data) => {
      setFamily(data);
      if (!data) setNotFound(true);
      setLoading(false);
    });
    const unsubMembers = subscribeToMembers(familyId, setMembers);

    return () => {
      unsubFamily();
      unsubMembers();
    };
  }, [familyId]);

  // Recompute generations whenever the member graph changes, keeping the
  // D3 layout's generation levels always accurate without manual upkeep.
  useEffect(() => {
    if (familyId && members.length) {
      syncGenerations(familyId, members).catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Generation sync failed:', err.message);
      });
    }
  }, [familyId, members]);

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

  const value = useMemo(
    () => ({
      familyId,
      family,
      members,
      loading,
      notFound,
      isAdmin,
      canEdit,
      refreshMembers,
      focusedPersonId,
      focusPerson,
      clearFocus,
    }),
    [familyId, family, members, loading, notFound, isAdmin, canEdit, refreshMembers, focusedPersonId, focusPerson, clearFocus]
  );

  return (
    <FamilyTreeContext.Provider value={value}>
      {children}
    </FamilyTreeContext.Provider>
  );
}

export function useFamilyTreeContext() {
  const ctx = useContext(FamilyTreeContext);
  if (!ctx) {
    throw new Error(
      'useFamilyTreeContext must be used within a FamilyTreeProvider'
    );
  }
  return ctx;
}
