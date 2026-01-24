import { expect, test } from 'bun:test'
import { Hono } from 'hono'
import { createRateLimiter } from '../src/middlewares/rate-limit'

test('login is rate limited', async () => {
  const app = new Hono()
  app.post('/auth/login', createRateLimiter({ windowMs: 1000, max: 2 }), c => c.json({ ok: true }))

  const headers = { 'x-forwarded-for': '1.1.1.1' }
  const first = await app.request('/auth/login', { method: 'POST', headers })
  const second = await app.request('/auth/login', { method: 'POST', headers })
  const third = await app.request('/auth/login', { method: 'POST', headers })

  expect(first.status).toBe(200)
  expect(second.status).toBe(200)
  expect(third.status).toBe(429)
})
