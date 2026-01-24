import { afterEach, expect, test } from 'bun:test'
import { Hono } from 'hono'

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET,
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

test('errors are masked in production', async () => {
  process.env.NODE_ENV = 'production'
  process.env.JWT_SECRET = 'test-secret'

  const { errorHandler } = await import(`../src/middlewares/error?test=${Date.now()}`)

  const app = new Hono()
  app.get('/boom', () => {
    throw new Error('boom')
  })
  app.onError(errorHandler)

  const res = await app.request('/boom')
  const body = await res.json()

  expect(body.success).toBe(false)
  expect(body.error?.message).toBe('internal error')
})
