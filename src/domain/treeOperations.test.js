import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreeOperation, collectSubtreeMembers, prepareSubtreeForCopy } from './treeOperations.js';

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
