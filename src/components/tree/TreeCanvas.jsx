import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, UserPlus } from 'lucide-react';
import { useFamilyTree } from '../../hooks/useFamilyTree.js';
import { useD3Tree } from '../../hooks/useD3Tree.js';
import PersonCard from './PersonCard.jsx';
import CoupleCard from './CoupleCard.jsx';
import ZoomControls from './ZoomControls.jsx';
import SearchBar from './SearchBar.jsx';

export default function TreeCanvas() {
  const navigate = useNavigate();
  const {
    familyId, members, isAdmin, canEdit, syncingMemberIds, focusedPersonId,
    focusedNodeId, focusPerson, clearFocus, addQuickChild, addQuickPartner,
  } =
    useFamilyTree();
  const syncingMemberIdSet = useMemo(() => new Set(syncingMemberIds), [syncingMemberIds]);
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

  const nodeRefs = useRef(new Map());
  const [nodeHeights, setNodeHeights] = useState(new Map());
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.location.reload();
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
        {canEdit && (
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

  // Measure node heights after render so positioning and link endpoints
  // can use actual DOM heights instead of the static NODE_HEIGHT.
  useEffect(() => {
    const map = new Map();
    nodeRefs.current.forEach((el, id) => {
      if (el && el.clientHeight) map.set(id, el.clientHeight);
    });
    setNodeHeights(map);
    const handleResize = () => {
      const m = new Map();
      nodeRefs.current.forEach((el, id) => {
        if (el && el.clientHeight) m.set(id, el.clientHeight);
      });
      setNodeHeights(m);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="tree-canvas-wrapper relative h-screen w-screen cursor-grab overflow-hidden bg-canvas-light active:cursor-grabbing dark:bg-canvas-dark"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <g style={{ transform: transformStyle, transformOrigin: '0 0' }}>
          {links.map((l) => {
            const [sx, sy] = l.source;
            const [tx, ty] = l.target;
            const sourceId = l.id.split('->')[0];
            const targetId = l.id.split('->')[1];
            const sourceHeight = nodeHeights.get(sourceId) ?? dimensions.NODE_HEIGHT;
            const targetHeight = nodeHeights.get(targetId) ?? dimensions.NODE_HEIGHT;
            const d = d3.linkVertical()({
              source: [sx, sy + sourceHeight / 2],
              target: [tx, ty - targetHeight / 2],
            });
            return (
              <path
                key={l.id}
                d={d}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeWidth: 2.5,
                  vectorEffect: 'non-scaling-stroke',
                  strokeDasharray: l.dashed ? '8 6' : undefined,
                }}
                className="tree-link stroke-slate-400/70 dark:stroke-slate-500/80"
              />
            );
          })}
        </g>
      </svg>

      <div
        className="absolute inset-0"
        style={{ transform: transformStyle, transformOrigin: '0 0' }}
      >
        {nodes.map((n) => {
          const { members: nodeMembers, isCouple, nodeId } = n.data;
          const width = isCouple ? dimensions.COUPLE_WIDTH : dimensions.SINGLE_WIDTH;
          const height = nodeHeights.get(nodeId) ?? dimensions.NODE_HEIGHT;
          return (
            <div
              key={nodeId}
              ref={(el) => {
                if (el) nodeRefs.current.set(nodeId, el);
                else nodeRefs.current.delete(nodeId);
              }}
              className="absolute animate-fade-in"
              style={{
                left: n.x - width / 2,
                top: n.y - height / 2,
                width,
              }}
            >
              {isCouple ? (
                <CoupleCard
                  members={nodeMembers}
                  onSelectPerson={handleSelectPerson}
                  syncingMemberIds={syncingMemberIdSet}
                  focusedPersonId={focusedPersonId}
                  isFocused={nodeMembers.some((member) => member.id === focusedPersonId)}
                  onAddChild={() => addQuickChild(nodeMembers.map((member) => member.id))}
                  onAddPartner={addQuickPartner}
                  onFocusCouple={() => handleSelectPerson(nodeMembers[0])}
                />
              ) : (
                <PersonCard
                  member={nodeMembers[0]}
                  onClick={handleSelectPerson}
                  isSyncing={syncingMemberIdSet.has(nodeMembers[0].id)}
                  isFocused={nodeMembers[0].id === focusedPersonId}
                  onAddChild={() => addQuickChild([nodeMembers[0].id])}
                  onAddPartner={() => addQuickPartner(nodeMembers[0].id)}
                />
              )}
            </div>
          );
        })}
      </div>

      <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onRecenter={resetZoom} />

      <button
        type="button"
        onClick={handleRefresh}
        aria-label="Refresh family tree"
        disabled={refreshing}
        className="pointer-events-auto fixed bottom-6 left-6 z-30 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-card transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Refreshing…' : 'Refresh'}
      </button>

    </div>
  );
}
