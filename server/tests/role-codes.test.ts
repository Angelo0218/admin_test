import { describe, expect, it } from 'bun:test'
import { isCreatableRoleCode, isRoleCode, ROLE_CODES } from '../src/constants/roles'

describe('role codes', () => {
  it('exports stable role codes', () => {
    expect(ROLE_CODES.ADMIN).toBe('ADMIN')
    expect(ROLE_CODES.AUDITOR).toBe('AUDITOR')
    expect(ROLE_CODES.SUPPORT).toBe('SUPPORT')
  })

  it('validates role codes at runtime', () => {
    expect(isRoleCode('ADMIN')).toBe(true)
    expect(isRoleCode('INVALID')).toBe(false)
  })

  it('limits creatable roles to support and auditor', () => {
    expect(isCreatableRoleCode(ROLE_CODES.ADMIN)).toBe(false)
    expect(isCreatableRoleCode(ROLE_CODES.SUPPORT)).toBe(true)
    expect(isCreatableRoleCode(ROLE_CODES.AUDITOR)).toBe(true)
  })
})
