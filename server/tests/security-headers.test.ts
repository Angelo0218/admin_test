import { expect, test } from 'bun:test'
import { Hono } from 'hono'
import { securityHeaders } from '../src/middlewares/security-headers'

test('security headers are present', async () => {
  const app = new Hono()
  app.use('*', securityHeaders)
  app.get('/', c => c.json({ ok: true }))

  const res = await app.request('/', {
    headers: { 'x-forwarded-proto': 'https' },
  })

  expect(res.headers.get('content-security-policy')).toBeTruthy()
  expect(res.headers.get('x-frame-options')).toBe('DENY')
  expect(res.headers.get('strict-transport-security')).toBeTruthy()
})
