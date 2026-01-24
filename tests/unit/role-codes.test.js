import assert from 'node:assert/strict'
import test from 'vitest'
import { ROLE_CODES } from '../../src/constants/roles.ts'

test('role codes are stable', () => {
  assert.equal(ROLE_CODES.ADMIN, 'ADMIN')
  assert.equal(ROLE_CODES.AUDITOR, 'AUDITOR')
  assert.equal(ROLE_CODES.SUPPORT, 'SUPPORT')
})
