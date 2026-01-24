import { expect, test } from 'bun:test'
import { Hono } from 'hono'

test('response shape is consistent', async () => {
  const { ok, fail } = await import(`../src/utils/response?test=${Date.now()}`)

  const app = new Hono()
  app.get('/ok', c => ok(c, { ok: true }))
  app.get('/fail', c => fail(c, 400, 'bad request', 400))

  const okRes = await app.request('/ok')
  const okBody = await okRes.json()

  expect(okRes.status).toBe(200)
  expect(okBody.success).toBe(true)
  expect(okBody.data?.ok).toBe(true)
  expect(okBody.error).toBeNull()

  const failRes = await app.request('/fail')
  const failBody = await failRes.json()

  expect(failRes.status).toBe(400)
  expect(failBody.success).toBe(false)
  expect(failBody.data).toBeNull()
  expect(failBody.error?.code).toBe(400)
  expect(failBody.error?.message).toBe('bad request')
})
