import assert from 'node:assert/strict'
import test from 'vitest'

import { filterStaffUsers, getStaffRoleOptions, isStaffUser, validateStaffCreateInput } from '../../src/utils/staff.js'

test('isStaffUser returns true when user has a staff role', () => {
  assert.equal(
    isStaffUser({ roles: [{ code: 'ADMIN' }] }),
    true,
  )
  assert.equal(
    isStaffUser({ roles: [{ code: 'SUPPORT' }] }),
    true,
  )
  assert.equal(
    isStaffUser({ roles: [{ code: 'AUDITOR' }] }),
    true,
  )
})

test('isStaffUser returns false when user has no staff role', () => {
  assert.equal(isStaffUser({ roles: [{ code: 'CUSTOMER' }] }), false)
  assert.equal(isStaffUser({ roles: [] }), false)
  assert.equal(isStaffUser({}), false)
})

test('filterStaffUsers returns only staff users', () => {
  const rows = [
    { id: 1, roles: [{ code: 'ADMIN' }] },
    { id: 2, roles: [{ code: 'CUSTOMER' }] },
    { id: 3, roles: [{ code: 'SUPPORT' }] },
  ]

  const result = filterStaffUsers(rows)

  assert.deepEqual(
    result.map(item => item.id),
    [1, 3],
  )
})

test('getStaffRoleOptions returns support and auditor options', () => {
  const options = getStaffRoleOptions(code => `Role: ${code}`)

  assert.deepEqual(options, [
    { label: 'Role: SUPPORT', value: 'SUPPORT' },
    { label: 'Role: AUDITOR', value: 'AUDITOR' },
  ])
})

test('validateStaffCreateInput returns error keys for invalid input', () => {
  assert.equal(
    validateStaffCreateInput({ username: 'ab', displayName: 'A', password: '123456', roleCode: 'SUPPORT' }),
    'users.create.usernameTooShort',
  )
  assert.equal(
    validateStaffCreateInput({ username: 'abc', displayName: '', password: '123456', roleCode: 'SUPPORT' }),
    'users.create.displayNameRequired',
  )
  assert.equal(
    validateStaffCreateInput({ username: 'abc', displayName: 'A', password: '123', roleCode: 'SUPPORT' }),
    'users.create.passwordTooShort',
  )
  assert.equal(
    validateStaffCreateInput({ username: 'abc', displayName: 'A', password: '123456', roleCode: '' }),
    'users.create.roleRequired',
  )
})

test('validateStaffCreateInput returns empty string for valid input', () => {
  assert.equal(
    validateStaffCreateInput({ username: 'admin01', displayName: 'Admin', password: '123456', roleCode: 'SUPPORT' }),
    '',
  )
})
