import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const SINGLE_WIDTH = 230;
const COUPLE_WIDTH = 460;
// The center of either person card inside CoupleCard. This accounts for the
// card's padding, heart gutter, and the two flex halves.
const COUPLE_MEMBER_CENTER_OFFSET = 117;
const NODE_HEIGHT = 800;
const GEN_GAP = 400;
const SIBLING_GAP = 30;

/** Canonical, order-independent key for a partnership. */
function unionKey(idA, idB) {
  return [idA, idB].sort().join('::');
}

/**
 * Turns the flat `members` array into a forest of couple/single nodes ready
 * for d3.hierarchy(). Exported standalone so it can be unit tested without
 * touching D3 or the DOM.
 *
 * @param {import('../types').Member[]} members
 * @returns {{ id: string, children: any[] }} synthetic root whose children
 *   are the generation-0 trees
 */
export function buildForest(members) {
  const byId = new Map(members.map((m) => [m.id, m]));

  // 1. Collect every partnership as a union, and every union's joint
  // children (deduplicated via the canonical key).
  const unions = new Map(); // key -> { key, memberIds: [id, id2?], childIds: Set }

  const ensureUnion = (key, memberIds) => {
    if (!unions.has(key)) {
      unions.set(key, { key, memberIds, childIds: new Set() });
    }
    return unions.get(key);
  };

  members.forEach((m) => {
    (m.partnerIds || []).forEach((partnerId) => {
      ensureUnion(unionKey(m.id, partnerId), [m.id, partnerId]);
    });
    (m.childrenDetails || []).forEach(({ childId, secondaryParentId }) => {
      const partnerId = secondaryParentId
        ? secondaryParentId
        : (m.partnerIds || []).find((id) => id !== m.id && byId.has(id));
      const key = partnerId ? unionKey(m.id, partnerId) : m.id;
      const union = partnerId
        ? ensureUnion(key, [m.id, partnerId])
        : ensureUnion(key, [m.id]); // single-parent "union"
      union.childIds.add(childId);
    });
  });

  // 2. Map each member to every union they belong to, so a person with
  // several partners renders as several discrete couple cards.
  const unionsByMember = new Map();
  unions.forEach((union) => {
    union.memberIds.forEach((id) => {
      if (!unionsByMember.has(id)) unionsByMember.set(id, []);
      unionsByMember.get(id).push(union);
    });
  });

  const visitedUnionKeys = new Set();

  function nodeForUnion(union) {
    if (visitedUnionKeys.has(union.key)) return null; // guard against cycles
    visitedUnionKeys.add(union.key);

    const nodeMembers = union.memberIds
      .map((id) => byId.get(id))
      .filter(Boolean);
    const children = Array.from(union.childIds)
      .flatMap((childId) => nodesForPerson(childId))
      .filter(Boolean);

    return {
      nodeId: `union:${union.key}`,
      isCouple: nodeMembers.length > 1,
      members: nodeMembers,
      generation: Math.min(...nodeMembers.map((m) => m.generation ?? 0)),
      children,
    };
  }

  /** A person may resolve to 1+ union nodes (multiple marriages), or a single node if unpartnered. */
  function nodesForPerson(memberId) {
    const member = byId.get(memberId);
    if (!member) return [];
    const personUnions = unionsByMember.get(memberId) || [];
    if (!personUnions.length) {
      const nodeId = `single:${memberId}`;
      if (visitedUnionKeys.has(nodeId)) return [];
      visitedUnionKeys.add(nodeId);
      return [
        {
          nodeId,
          isCouple: false,
          members: [member],
          generation: member.generation ?? 0,
          children: [],
        },
      ];
    }
    return personUnions.map(nodeForUnion).filter(Boolean);
  }

  // 3. Roots are unions whose members are not listed as children of any
  // other union. This prevents a couple from becoming a root just because one
  // partner has no parents while the other partner does.
  const childIds = new Set();
  unions.forEach((union) => {
    union.childIds.forEach((childId) => childIds.add(childId));
  });

  const rootUnions = Array.from(unions.values()).filter(
    (union) => !union.memberIds.some((id) => childIds.has(id))
  );

  const membersWithUnions = new Set();
  unions.forEach((union) => {
    union.memberIds.forEach((id) => membersWithUnions.add(id));
  });

  const rootSingleNodes = members
    .filter((m) => !membersWithUnions.has(m.id) && !(m.parentIds || []).length)
    .flatMap((m) => nodesForPerson(m.id))
    .filter(Boolean);

  const rootNodes = [...rootUnions.flatMap(nodeForUnion), ...rootSingleNodes].filter(Boolean);

  return { nodeId: 'root', isCouple: false, members: [], children: rootNodes };
}

/** Width, in px, a node occupies - used for D3's separation() spacing. */
function nodeWidth(node) {
  return node.isCouple ? COUPLE_WIDTH : SINGLE_WIDTH;
}

/**
 * Runs the D3 tree layout over the forest and returns flat arrays of
 * positioned nodes and the link paths connecting them.
 */
function layoutTree(forestRoot, members) {
  const parentCount = new Map(members.map((member) => [member.id, (member.parentIds || []).length]));
  const root = d3.hierarchy(forestRoot, (d) => d.children);
  const treeLayout = d3
    .tree()
    .nodeSize([SINGLE_WIDTH + SIBLING_GAP, GEN_GAP])
    .separation((a, b) => {
      const base = (nodeWidth(a.data) + nodeWidth(b.data)) / (2 * SINGLE_WIDTH);
      return a.parent === b.parent ? base : base + 0.4;
    });

  const positioned = treeLayout(root);
  const allNodes = positioned
    .descendants()
    .filter((d) => d.data.nodeId !== 'root');

  const links = positioned
    .links()
    .filter((l) => l.source.data.nodeId !== 'root')
    .map((l) => {
      const isSingleParentLink = l.target.data.members.some(
        (member) => parentCount.get(member.id) === 1
      );
      // A target couple node may contain one person who is the actual child and
      // another who is simply their partner. Point to the child's card half,
      // instead of the center of the combined couple container.
      const sourceMemberIds = new Set(l.source.data.members.map((member) => member.id));
      const childMemberIndex = l.target.data.members.findIndex((member) =>
        (member.parentIds || []).some((parentId) => sourceMemberIds.has(parentId))
      );
      const targetOffset = l.target.data.isCouple && childMemberIndex >= 0
        ? childMemberIndex === 0
          ? -COUPLE_MEMBER_CENTER_OFFSET
          : COUPLE_MEMBER_CENTER_OFFSET
        : 0;

      // Return raw source/target coordinates; consumer applies node-specific
      // vertical offsets (measured heights) when constructing the final path.
      return {
        id: `${l.source.data.nodeId}->${l.target.data.nodeId}`,
        source: [l.source.x, l.source.y],
        target: [l.target.x + targetOffset, l.target.y],
        dashed: isSingleParentLink,
      };
    });

  return { nodes: allNodes, links };
}

/**
 * Builds the tree layout from `members` and manages a D3 zoom/pan behavior
 * bound to `containerRef`. Returns positioned nodes/links (in layout
 * coordinates) plus the current zoom transform, so the caller can render
 * HTML cards and SVG links that share the same transform.
 */
export function useD3Tree(members) {
  const containerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const { nodes, links } = useMemo(() => {
    if (!members?.length) return { nodes: [], links: [] };
    const forest = buildForest(members);
    return layoutTree(forest, members);
  }, [members]);

  const nodesById = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.data.nodeId, n));
    return map;
  }, [nodes]);

  // Wire up d3.zoom() once per container mount.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.25, 2.5])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    const selection = d3.select(el);
    selection.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      selection.on('.zoom', null);
    };
  }, []);

  const applyTransform = useCallback((t, animated = true) => {
    const el = containerRef.current;
    if (!el || !zoomBehaviorRef.current) return;
    const selection = d3.select(el);
    const target = d3.zoomIdentity.translate(t.x, t.y).scale(t.k);
    if (animated) {
      selection.transition().duration(400).call(zoomBehaviorRef.current.transform, target);
    } else {
      selection.call(zoomBehaviorRef.current.transform, target);
    }
  }, []);

  const zoomBy = useCallback(
    (factor) => {
      const el = containerRef.current;
      if (!el || !zoomBehaviorRef.current) return;
      d3.select(el)
        .transition()
        .duration(200)
        .call(zoomBehaviorRef.current.scaleBy, factor);
    },
    []
  );

  const zoomIn = useCallback(() => zoomBy(1.3), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.3), [zoomBy]);

  const resetZoom = useCallback(() => {
    const el = containerRef.current;
    if (!el || !nodes.length) return;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - COUPLE_WIDTH;
    const maxX = Math.max(...xs) + COUPLE_WIDTH;
    const minY = Math.min(...ys) - NODE_HEIGHT;
    const maxY = Math.max(...ys) + NODE_HEIGHT;

    const { clientWidth, clientHeight } = el;
    const scale = Math.min(
      2,
      0.9 / Math.max((maxX - minX) / clientWidth, (maxY - minY) / clientHeight)
    );
    const scaleValue = Number.isFinite(scale) && scale > 0 ? scale : 1;

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    applyTransform({
      x: clientWidth / 2 - midX * scaleValue,
      y: clientHeight / 2 - midY * scaleValue,
      k: scaleValue,
    });
  }, [nodes, applyTransform]);

  const centerOnNodeId = useCallback(
    (nodeId) => {
      const el = containerRef.current;
      const node = nodesById.get(nodeId);
      if (!el || !node) return;
      const { clientWidth, clientHeight } = el;
      const k = Math.max(transform.k, 1);
      applyTransform({
        x: clientWidth / 2 - node.x * k,
        y: clientHeight / 2 - node.y * k,
        k,
      });
    },
    [nodesById, transform.k, applyTransform]
  );

  /** Finds the rendered node (couple or single) containing a given member id. */
  const findNodeForMember = useCallback(
    (memberId) =>
      nodes.find((n) => n.data.members.some((m) => m.id === memberId)),
    [nodes]
  );

  const centerOnMember = useCallback(
    (memberId) => {
      const node = findNodeForMember(memberId);
      if (node) centerOnNodeId(node.data.nodeId);
    },
    [findNodeForMember, centerOnNodeId]
  );

  // Auto-fit the very first time the tree has data.
  const didInitialFit = useRef(false);
  useEffect(() => {
    if (nodes.length && !didInitialFit.current) {
      didInitialFit.current = true;
      // Wait one tick so the container has real dimensions.
      requestAnimationFrame(() => resetZoom());
    }
  }, [nodes, resetZoom]);

  return {
    containerRef,
    nodes,
    links,
    transform,
    zoomIn,
    zoomOut,
    resetZoom,
    centerOnNodeId,
    centerOnMember,
    nodeWidth,
    dimensions: { SINGLE_WIDTH, COUPLE_WIDTH, NODE_HEIGHT },
  };
}
