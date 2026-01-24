import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { ROLE_CODES } from '../src/constants/roles'
import {
  clearPermissionCache,
  getPermissionTreePublic,
  isCodeAllowed,
  PERMISSION_CACHE_TTL_MS,
  permissionTree,
} from '../src/models/permission'

describe('permission model', () => {
  const originalNow = Date.now

  beforeEach(() => {
    clearPermissionCache()
  })

  afterEach(() => {
    Date.now = originalNow
  })

  it('filters tree by role and strips frontend-only fields', () => {
    const supportTree = getPermissionTreePublic(ROLE_CODES.SUPPORT)
    expect(supportTree.some(node => node.code === 'Kyc')).toBe(false)
    expect(supportTree.some(node => node.code === 'Tickets')).toBe(true)

    const adminTree = getPermissionTreePublic(ROLE_CODES.ADMIN)
    const node = adminTree[0]
    expect(node).toHaveProperty('code')
    expect(node).toHaveProperty('name')
    expect(node).toHaveProperty('type')
    expect(node).toHaveProperty('children')
    expect('component' in node).toBe(false)
    expect('layout' in node).toBe(false)
    expect('icon' in node).toBe(false)
    expect('redirect' in node).toBe(false)
    expect('path' in node).toBe(false)
  })

  it('validates permission codes safely', () => {
    expect(isCodeAllowed('KycDetail', ROLE_CODES.ADMIN)).toBe(true)
    expect(isCodeAllowed('KycDetail', ROLE_CODES.SUPPORT)).toBe(false)
    expect(isCodeAllowed('UnknownCode', ROLE_CODES.ADMIN)).toBe(false)
  })

  it('invalidates cache after ttl', () => {
    Date.now = () => 0
    expect(isCodeAllowed('Temp', ROLE_CODES.ADMIN)).toBe(false)

    const tempNode = {
      code: 'Temp',
      name: 'Temp',
      type: 'MENU',
      roles: [ROLE_CODES.ADMIN],
    }
    permissionTree.push(tempNode)

    Date.now = () => PERMISSION_CACHE_TTL_MS + 1
    expect(isCodeAllowed('Temp', ROLE_CODES.ADMIN)).toBe(true)

    permissionTree.pop()
  })
})
