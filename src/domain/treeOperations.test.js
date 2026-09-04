import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreeOperation, collectSubtreeMembers, prepareSubtreeForCopy } from './treeOperations.js';
import { getLayoutModeConfig } from '../hooks/useD3Tree.js';
import { buildHybridLayout } from '../hooks/layouts/hybridLayout.js';

test('reorders a child one step left within a parent child list', () => {
  const members = [
    {
      id: 'parent',
      name: 'Parent',
      parentIds: [],
      partnerIds: [],
      childrenDetails: [
        { childId: 'child-a', secondaryParentId: null },
        { childId: 'child-b', secondaryParentId: null },
      ],
    },
    {
      id: 'child-a',
      name: 'Child A',
      parentIds: ['parent'],
      partnerIds: [],
      childrenDetails: [],
    },
    {
      id: 'child-b',
      name: 'Child B',
      parentIds: ['parent'],
      partnerIds: [],
      childrenDetails: [],
    },
  ];

  const reordered = applyTreeOperation(members, {
    type: 'parentChild.reorder',
    parentIds: ['parent'],
    childId: 'child-b',
    direction: 'left',
  });

  const parent = reordered.find((member) => member.id === 'parent');
  assert.deepEqual(parent.childrenDetails.map((item) => item.childId), ['child-b', 'child-a']);
});

test('collects a selected root member and all descendants into a subtree', () => {
  const members = [
    { id: 'root', name: 'Root', parentIds: [], partnerIds: [], childrenDetails: [{ childId: 'child', secondaryParentId: null }] },
    { id: 'child', name: 'Child', parentIds: ['root'], partnerIds: [], childrenDetails: [{ childId: 'grandchild', secondaryParentId: null }] },
    { id: 'grandchild', name: 'Grandchild', parentIds: ['child'], partnerIds: [], childrenDetails: [] },
    { id: 'other', name: 'Other', parentIds: [], partnerIds: [], childrenDetails: [] },
  ];

  const subtree = collectSubtreeMembers(members, 'root');
  assert.deepEqual(subtree.map((member) => member.id).sort(), ['child', 'grandchild', 'root']);
});

test('preserves partner and descendant links from the selected node when preparing a subtree copy', () => {
  const members = [
    { id: 'root', name: 'Root', parentIds: ['ancestor'], partnerIds: ['partner'], childrenDetails: [{ childId: 'child', secondaryParentId: null }] },
    { id: 'partner', name: 'Partner', parentIds: [], partnerIds: ['root'], childrenDetails: [] },
    { id: 'child', name: 'Child', parentIds: ['root'], partnerIds: ['grandchild'], childrenDetails: [{ childId: 'grandchild', secondaryParentId: null }] },
    { id: 'grandchild', name: 'Grandchild', parentIds: ['child'], partnerIds: ['child'], childrenDetails: [] },
    { id: 'ancestor', name: 'Ancestor', parentIds: [], partnerIds: [], childrenDetails: [] },
  ];

  const subtree = prepareSubtreeForCopy(members, 'root');
  const root = subtree.find((member) => member.id === 'root');
  const child = subtree.find((member) => member.id === 'child');
  const grandchild = subtree.find((member) => member.id === 'grandchild');

  assert.deepEqual(root.parentIds, []);
  assert.deepEqual(root.partnerIds, ['partner']);
  assert.deepEqual(root.childrenDetails.map((item) => item.childId), ['child']);
  assert.deepEqual(child.partnerIds, ['grandchild']);
  assert.deepEqual(grandchild.parentIds, ['child']);
});

test('defines the supported tree layout modes and their hybrid behavior', () => {
  assert.equal(getLayoutModeConfig('top-down').id, 'top-down');
  assert.equal(getLayoutModeConfig('left-right').id, 'left-right');
  assert.equal(getLayoutModeConfig('hybrid').id, 'hybrid');
  assert.equal(getLayoutModeConfig('hybrid').firstTwoGenerationsHorizontal, true);
});

test('uses horizontal placement for generations below 2 and vertical placement for generation 2 and deeper', () => {
  const forestRoot = {
    nodeId: 'root',
    isCouple: false,
    members: [],
    generation: 0,
    children: [
      {
        nodeId: 'parent',
        isCouple: false,
        members: [{ id: 'parent', generation: 1 }],
        generation: 1,
        children: [
          {
            nodeId: 'child',
            isCouple: false,
            members: [{ id: 'child', generation: 2 }],
            generation: 2,
            children: [],
          },
        ],
      },
    ],
  };

  const { nodes } = buildHybridLayout(forestRoot);
  const byId = new Map(nodes.map((node) => [node.data.nodeId, node]));

  assert.ok(byId.get('parent').x > byId.get('root').x, 'generation 1 should be laid out to the right');
  assert.ok(byId.get('child').y > byId.get('parent').y, 'generation 2 and deeper should be laid out downward');
});
