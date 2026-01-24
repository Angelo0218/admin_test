import { afterEach, expect, test } from 'bun:test'

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
}

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (typeof value === 'undefined') {
      delete process.env[key]
    }
    else {
      process.env[key] = value
    }
  }
})

test('refresh token preserves payload', async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.NODE_ENV = 'test'

  const { signRefreshToken, verifyRefreshToken } = await import(`../src/models/auth?test=${Date.now()}`)

  const payload = { userId: 'user-1', role: 'ADMIN', username: 'admin' }
  const token = signRefreshToken(payload)
  const decoded = verifyRefreshToken(token)

  expect(decoded.userId).toBe(payload.userId)
  expect(decoded.role).toBe(payload.role)
  expect(decoded.username).toBe(payload.username)
})
