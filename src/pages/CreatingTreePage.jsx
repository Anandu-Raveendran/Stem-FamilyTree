import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/common/Loader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../components/common/Toast.jsx';
import { createFamilyFromSubtree } from '../services/familyService.js';

export default function CreatingTreePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const state = location.state || {};

    if (!state.sourceFamilyId || !state.name || !state.rootMemberIds?.length) {
      toast.error('Unable to create the new tree right now.');
      navigate('/', { replace: true });
      return undefined;
    }

    if (!user?.uid) {
      toast.info('Sign in first so you can create a new tree.');
      navigate('/', { replace: true });
      return undefined;
    }

    let cancelled = false;

    const createTree = async () => {
      try {
        const newFamilyId = await createFamilyFromSubtree({
          name: state.name,
          ownerId: state.ownerId || user.uid,
          ownerEmail: state.ownerEmail || user.email || '',
          sourceFamilyId: state.sourceFamilyId,
          rootMemberIds: state.rootMemberIds,
          deleteSourceMembers: Boolean(state.deleteSourceMembers),
        });

        if (cancelled) return;

        window.localStorage.setItem('family-tree-recent-id', newFamilyId);
        navigate(`/tree/${newFamilyId}`, { replace: true });
        window.location.reload();
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Unable to create the new tree right now.');
          navigate('/', { replace: true });
        }
      }
    };

    createTree();

    return () => {
      cancelled = true;
    };
  }, [location.state, navigate, toast, user]);

  return <Loader label="Creating tree…" />;
}
