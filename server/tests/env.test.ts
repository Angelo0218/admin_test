import { afterEach, expect, test } from 'bun:test'

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
  CI: process.env.CI,
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

test('JWT_SECRET is required in production', async () => {
  process.env.NODE_ENV = 'production'
  delete process.env.JWT_SECRET
  delete process.env.CI

  const { resolveEnv } = await import(`../src/config/env?test=${Date.now()}`)
  expect(() => resolveEnv()).toThrow()
})
