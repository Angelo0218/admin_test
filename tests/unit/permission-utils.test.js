import assert from 'node:assert/strict'
import test from 'vitest'
import { buildPermissionTreeOptions, collectPermissionCodes } from '../../src/utils/permission.ts'

const sampleTree = [
  {
    code: 'Root',
    name: 'Root',
    roles: ['ADMIN'],
    children: [
      { code: 'Child', name: 'Child', roles: ['ADMIN', 'SUPPORT'] },
    ],
  },
  {
    code: 'Solo',
    name: 'Solo',
    roles: ['SUPPORT'],
  },
]

test('buildPermissionTreeOptions maps to naive tree format', () => {
  const options = buildPermissionTreeOptions(sampleTree)

  assert.deepEqual(options, [
    {
      label: 'Root',
      key: 'Root',
      children: [
        { label: 'Child', key: 'Child' },
      ],
    },
    { label: 'Solo', key: 'Solo' },
  ])
})

test('collectPermissionCodes filters by role', () => {
  const codes = collectPermissionCodes(sampleTree, 'SUPPORT')

  assert.deepEqual(codes.sort(), ['Child', 'Solo'])
})
