import { describe, expect, it } from 'bun:test'
import { seedRoles, seedUsers } from '../src/seed/fixtures'

describe('seed fixtures', () => {
  it('define roles and users with display names', () => {
    expect(seedRoles.length).toBeGreaterThan(0)
    expect(seedUsers.every(user => user.username && user.displayName)).toBe(true)
  })
})
