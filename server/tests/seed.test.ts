import { afterEach, expect, test } from 'bun:test'

const originalEnableSeed = process.env.ENABLE_SEED

afterEach(() => {
  if (typeof originalEnableSeed === 'undefined') {
    delete process.env.ENABLE_SEED
  }
  else {
    process.env.ENABLE_SEED = originalEnableSeed
  }
})

test('seed should not run without ENABLE_SEED', async () => {
  delete process.env.ENABLE_SEED
  const { seedDefaults } = await import('../src/models/seed')
  const { prisma } = await import('../src/db/client')

  const originalCount = prisma.user.count
  prisma.user.count = () => {
    throw new Error('seed should be gated before database access')
  }

  try {
    const result = await seedDefaults()
    expect(result?.skipped).toBe(true)
  }
  finally {
    prisma.user.count = originalCount
  }
})
