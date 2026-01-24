import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { resolveDatabasePath } from '../src/scripts/seed-reset'

describe('resolveDatabasePath', () => {
  it('resolves sqlite file url against prisma directory', () => {
    const prismaDir = path.join('C:', 'repo', 'server', 'prisma')
    const result = resolveDatabasePath('file:./dev.db', prismaDir)
    expect(result).toBe(path.join(prismaDir, 'dev.db'))
  })

  it('returns null for non-file urls', () => {
    const prismaDir = path.join('C:', 'repo', 'server', 'prisma')
    const result = resolveDatabasePath('postgres://localhost/db', prismaDir)
    expect(result).toBeNull()
  })
})
