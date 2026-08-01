import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTreeOperation } from './treeOperations.js';

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
