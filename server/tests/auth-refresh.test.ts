import { expect, test } from 'bun:test'
import { Hono } from 'hono'
import { readRefreshTokenCookie } from '../src/controllers/auth'

test('refresh token is read from cookie', async () => {
  const app = new Hono()
  app.post('/auth/refresh/token', c => c.text(readRefreshTokenCookie(c)))

  const res = await app.request('/auth/refresh/token', {
    method: 'POST',
    headers: {
      Cookie: 'refreshToken=abc123',
    },
  })

  expect(await res.text()).toBe('abc123')
})
