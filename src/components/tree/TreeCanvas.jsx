import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';
import { useD3Tree } from '../../hooks/useD3Tree.js';
import PersonCard from './PersonCard.jsx';
import CoupleCard from './CoupleCard.jsx';
import ZoomControls from './ZoomControls.jsx';
import SearchBar from './SearchBar.jsx';

export default function TreeCanvas() {
  const navigate = useNavigate();
  const { familyId, members, isAdmin, focusedPersonId, focusedNodeId, focusPerson, clearFocus } =
    useFamilyTree();
  const {
    containerRef,
    nodes,
    links,
    transform,
    zoomIn,
    zoomOut,
    resetZoom,
    centerOnNodeId,
    centerOnMember,
    dimensions,
  } = useD3Tree(members);

  useEffect(() => {
    if (focusedPersonId) centerOnMember(focusedPersonId);
    else if (focusedPersonId) centerOnMember(focusedPersonId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedNodeId, focusedPersonId]);

  const handleSelectPerson = (member, nodeId = null) => {
    focusPerson(member.id, nodeId);
    navigate(`/tree/${familyId}/person/${member.id}`);
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      clearFocus();
      navigate(`/tree/${familyId}`);
    }
  };

  if (!members.length) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-canvas-light px-6 text-center dark:bg-canvas-dark">
        <h1 className="font-display text-2xl font-semibold">
          This tree doesn&apos;t have anyone in it yet
        </h1>
        <p className="max-w-sm text-sm text-ink-light/60 dark:text-ink-dark/60">
          Add the first family member to start building the tree. Everyone
          else will branch out from there.
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate(`/tree/${familyId}/add`)}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-card transition hover:bg-accent/90"
          >
            <UserPlus className="h-4 w-4" />
            Add first family member
          </button>
        )}
      </div>
    );
  }

  const transformStyle = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="tree-canvas-wrapper relative h-screen w-screen cursor-grab overflow-hidden bg-canvas-light active:cursor-grabbing dark:bg-canvas-dark"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <g style={{ transform: transformStyle, transformOrigin: '0 0' }}>
          {links.map((l) => (
            <path
              key={l.id}
              d={l.path}
              className="tree-link stroke-black/15 dark:stroke-white/15"
            />
          ))}
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{ transform: transformStyle, transformOrigin: '0 0' }}
      >
        {nodes.map((n) => {
          const { members: nodeMembers, isCouple, nodeId } = n.data;
          const width = isCouple ? dimensions.COUPLE_WIDTH : dimensions.SINGLE_WIDTH;
          return (
            <div
              key={nodeId}
              className="absolute animate-fade-in"
              style={{
                left: n.x - width / 2,
                top: n.y - dimensions.NODE_HEIGHT / 2,
                width,
              }}
            >
              {isCouple ? (
                <CoupleCard members={nodeMembers} onSelectPerson={handleSelectPerson} />
              ) : (
                <PersonCard member={nodeMembers[0]} onClick={handleSelectPerson} />
              )}
            </div>
          );
        })}
      </div>

      <SearchBar onSelect={(m) => handleSelectPerson(m)} />
      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onRecenter={resetZoom} />

       {isAdmin && (
        <button
          type="button"
          onClick={() => navigate(`/tree/${familyId}/add`)}
          aria-label="Add family member"
          className="pointer-events-auto fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-white shadow-card transition hover:bg-accent/90 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Add member
        </button>
      )}
    </div>
  );
}
