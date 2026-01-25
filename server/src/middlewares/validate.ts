import type { z } from 'zod'
import { createMiddleware } from 'hono/factory'

function formatError(error: z.ZodError) {
  const first = error.errors[0]
  return first?.message || 'invalid request'
}

export function validateJson<T extends z.ZodTypeAny>(schema: T) {
  return createMiddleware(async (c, next) => {
    let body: unknown = null
    try {
      body = await c.req.json()
    }
    catch {
      body = null
    }
    const result = schema.safeParse(body)
    if (!result.success) {
      return c.json({ code: 400, message: formatError(result.error), data: null }, 400)
    }
    c.set('validatedBody', result.data)
    await next()
  })
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return createMiddleware(async (c, next) => {
    const params = c.req.param()
    const result = schema.safeParse(params)
    if (!result.success) {
      return c.json({ code: 400, message: formatError(result.error), data: null }, 400)
    }
    c.set('validatedParams', result.data)
    await next()
  })
}
