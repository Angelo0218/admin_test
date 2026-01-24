import { describe, expect, it } from 'bun:test'
import { buildAuditWhere } from '../src/models/audit'

describe('buildAuditWhere', () => {
  it('adds actor displayName to keyword search', () => {
    const where = buildAuditWhere({ keyword: 'Admin' })

    expect(where.OR).toEqual([
      { targetId: { contains: 'Admin' } },
      { action: { contains: 'Admin' } },
      { actor: { displayName: { contains: 'Admin' } } },
    ])
  })
})
