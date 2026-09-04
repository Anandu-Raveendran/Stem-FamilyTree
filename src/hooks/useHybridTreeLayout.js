import { useMemo } from 'react';
import * as d3 from 'd3';
import { SINGLE_WIDTH, COUPLE_WIDTH, NODE_HEIGHT } from './layouts/layoutConstants.js';

const HYBRID_HORIZONTAL_GAP = 1040;
const HYBRID_VERTICAL_GAP = 1040;
const HYBRID_BRANCH_OFFSET = 1020;

export function buildHybridLayout(forestRoot) {
  const root = d3.hierarchy(forestRoot, (node) => node.children);
  const positions = new Map();

  function assignPosition(node, parent = null) {
    const parentPos = parent ? positions.get(parent.data.nodeId) ?? { x: 0, y: 0 } : { x: 0, y: 0 };
    const generation = node.data.generation ?? 0;
    const siblings = parent ? parent.children ?? [] : [];
    const siblingIndex = parent ? siblings.findIndex((child) => child.data.nodeId === node.data.nodeId) : 0;
    const siblingCount = Math.max(parent ? siblings.length : 1, 1);
    const centeredOffset = parent ? (siblingIndex - (siblingCount - 1) / 2) * HYBRID_VERTICAL_GAP : 0;

    let x = 0;
    let y = 0;

    if (!parent) {
      x = 0;
      y = 0;
    } else if (generation < 2) {
      x = parentPos.x + HYBRID_HORIZONTAL_GAP;
      y = parentPos.y + centeredOffset;
    } else {
      x = parentPos.x + HYBRID_BRANCH_OFFSET;
      y = parentPos.y + centeredOffset;
    }

    positions.set(node.data.nodeId, { x, y });
    (node.children ?? []).forEach((child) => assignPosition(child, node));
  }

  assignPosition(root);

  const nodes = root
    .descendants()
    .filter((node) => node.data.nodeId !== 'root')
    .map((node) => ({
      ...node,
      x: positions.get(node.data.nodeId)?.x ?? 0,
      y: positions.get(node.data.nodeId)?.y ?? 0,
    }));

  const links = root
    .links()
    .filter((link) => link.source.data.nodeId !== 'root')
    .map((link) => {
      const source = positions.get(link.source.data.nodeId) ?? { x: 0, y: 0 };
      const target = positions.get(link.target.data.nodeId) ?? { x: 0, y: 0 };
      const sourceGeneration = link.source.data.generation ?? 0;
      const targetGeneration = link.target.data.generation ?? 0;
      const isHorizontal = sourceGeneration < 2 && targetGeneration < 2;

      return {
        id: `${link.source.data.nodeId}->${link.target.data.nodeId}`,
        source: [source.x, source.y],
        target: [target.x, target.y],
        dashed: false,
        orientation: isHorizontal ? 'horizontal' : 'vertical',
      };
    });

  return { nodes, links };
}

export const dimensions = { SINGLE_WIDTH, COUPLE_WIDTH, NODE_HEIGHT };

export function useHybridTreeLayout(members) {
  return useMemo(() => {
    if (!members?.length) return { nodes: [], links: [] };

    const root = {
      nodeId: 'root',
      isCouple: false,
      members: [],
      generation: 0,
      children: members.map((member) => ({
        nodeId: member.id,
        isCouple: false,
        members: [member],
        generation: member.generation ?? 0,
        children: [],
      })),
    };

    return buildHybridLayout(root);
  }, [members]);
}
