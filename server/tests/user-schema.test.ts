import { describe, expect, it } from 'bun:test'
import { userCreateSchema, userDeleteSchema, userListQuerySchema, userPasswordChangeSchema } from '../src/schemas/user'

describe('user schemas', () => {
  it('accepts valid staff account payload', () => {
    const result = userCreateSchema.safeParse({
      username: 'support_01',
      password: 'Aa123456',
      displayName: 'Support One',
      roleCode: 'SUPPORT',
    })

    expect(result.success).toBe(true)
  })

  it('rejects admin role for staff creation', () => {
    const result = userCreateSchema.safeParse({
      username: 'admin_02',
      password: 'Aa123456',
      displayName: 'Admin Two',
      roleCode: 'ADMIN',
    })

    expect(result.success).toBe(false)
  })

  it('requires admin password for deletion', () => {
    expect(userDeleteSchema.safeParse({ adminPassword: 'Aa123456' }).success).toBe(true)
    expect(userDeleteSchema.safeParse({}).success).toBe(false)
  })

  it('does not accept status in list query', () => {
    const result = userListQuerySchema.safeParse({ status: 'ACTIVE' })
    expect(result.success).toBe(false)
  })

  it('accepts valid password change payload', () => {
    const result = userPasswordChangeSchema.safeParse({
      currentPassword: 'OldPass123',
      newPassword: 'NewPass123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid password change payload', () => {
    const result = userPasswordChangeSchema.safeParse({
      currentPassword: '123',
      newPassword: '',
    })

    expect(result.success).toBe(false)
  })
})
