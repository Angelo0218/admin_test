import { describe, expect, test } from 'bun:test'
import { Hono } from 'hono'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1),
})

describe('validateQuery', () => {
  test('validates query and stores parsed data', async () => {
    const mod = await import('./validate')
    expect(typeof mod.validateQuery).toBe('function')
    if (typeof mod.validateQuery !== 'function')
      return

    const app = new Hono()
    app.get('/test', mod.validateQuery(querySchema), (c) => {
      return c.json(c.get('validatedQuery'))
    })

    const res = await app.request('/test?page=2')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ page: 2 })
  })

  test('rejects invalid query', async () => {
    const mod = await import('./validate')
    expect(typeof mod.validateQuery).toBe('function')
    if (typeof mod.validateQuery !== 'function')
      return

    const app = new Hono()
    app.get('/test', mod.validateQuery(querySchema), c => c.text('ok'))

    const res = await app.request('/test?page=0')
    expect(res.status).toBe(400)
  })
})
