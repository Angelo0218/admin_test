import type { z } from 'zod'
import { createMiddleware } from 'hono/factory'
import { fail } from '../utils/response'

function formatError(error: z.ZodError) {
  const first = error.errors[0]
  if (!first)
    return 'invalid request'
  const path = first.path?.length ? first.path.join('.') : ''
  return path ? `${path} ${first.message}` : first.message
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
    if (!result.success)
      return fail(c, 400, formatError(result.error), 400)
    c.set('validatedBody', result.data)
    await next()
  })
}

export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return createMiddleware(async (c, next) => {
    const params = c.req.param()
    const result = schema.safeParse(params)
    if (!result.success)
      return fail(c, 400, formatError(result.error), 400)
    c.set('validatedParams', result.data)
    await next()
  })
}

export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return createMiddleware(async (c, next) => {
    const query = c.req.query()
    const result = schema.safeParse(query)
    if (!result.success)
      return fail(c, 400, formatError(result.error), 400)
    c.set('validatedQuery', result.data)
    await next()
  })
}
