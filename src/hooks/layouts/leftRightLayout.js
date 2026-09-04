import * as d3 from 'd3';
import { SINGLE_WIDTH, COUPLE_WIDTH, COUPLE_MEMBER_CENTER_OFFSET, NODE_HEIGHT } from './layoutConstants.js';

const LEFT_RIGHT_HORIZONTAL_GAP = 200;
const LEFT_RIGHT_VERTICAL_SPREAD = SINGLE_WIDTH + 600;

export function buildLeftRightLayout(forestRoot, members) {
  const parentCount = new Map(members.map((member) => [member.id, (member.parentIds || []).length]));
  const root = d3.hierarchy(forestRoot, (d) => d.children);
  const treeLayout = d3
    .tree()
    .nodeSize([LEFT_RIGHT_HORIZONTAL_GAP, LEFT_RIGHT_VERTICAL_SPREAD])
    .separation((a, b) => {
      const base = (nodeWidth(a.data) + nodeWidth(b.data)) / (2 * SINGLE_WIDTH);
      return a.parent === b.parent ? base : base + 0.4;
    });

  const positioned = treeLayout(root);
  const allNodes = positioned
    .descendants()
    .filter((d) => d.data.nodeId !== 'root')
    .map((d) => ({
      ...d,
      x: d.y,
      y: d.x,
    }));

  const links = positioned
    .links()
    .filter((l) => l.source.data.nodeId !== 'root')
    .map((l) => {
      const isSingleParentLink = l.target.data.members.some(
        (member) => parentCount.get(member.id) === 1
      );
      const sourceMemberIds = new Set(l.source.data.members.map((member) => member.id));
      const childMemberIndex = l.target.data.members.findIndex((member) =>
        (member.parentIds || []).some((parentId) => sourceMemberIds.has(parentId))
      );
      const targetOffset = l.target.data.isCouple && childMemberIndex >= 0
        ? childMemberIndex === 0
          ? -COUPLE_MEMBER_CENTER_OFFSET
          : COUPLE_MEMBER_CENTER_OFFSET
        : 0;

      return {
        id: `${l.source.data.nodeId}->${l.target.data.nodeId}`,
        source: [l.source.y, l.source.x],
        target: [l.target.y + targetOffset, l.target.x],
        dashed: isSingleParentLink,
        orientation: 'horizontal',
      };
    });

  return { nodes: allNodes, links };
}

function nodeWidth(node) {
  return node.isCouple ? COUPLE_WIDTH : SINGLE_WIDTH;
}

export const dimensions = { SINGLE_WIDTH, COUPLE_WIDTH, NODE_HEIGHT };
