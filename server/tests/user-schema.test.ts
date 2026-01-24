import { describe, expect, it } from 'bun:test'
import { userCreateSchema, userDeleteSchema } from '../src/schemas/user'

describe('user schemas', () => {
  it('accepts valid staff account payload', () => {
    const result = userCreateSchema.safeParse({
      username: 'support_01',
      password: '123456',
      displayName: 'Support One',
      roleCode: 'SUPPORT',
    })

    expect(result.success).toBe(true)
  })

  it('rejects admin role for staff creation', () => {
    const result = userCreateSchema.safeParse({
      username: 'admin_02',
      password: '123456',
      displayName: 'Admin Two',
      roleCode: 'ADMIN',
    })

    expect(result.success).toBe(false)
  })

  it('requires admin password for deletion', () => {
    expect(userDeleteSchema.safeParse({ adminPassword: '123456' }).success).toBe(true)
    expect(userDeleteSchema.safeParse({}).success).toBe(false)
  })
})
