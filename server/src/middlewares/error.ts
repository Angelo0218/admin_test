import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { env } from '../config/env'
import { logError } from '../utils/logger'
import { fail } from '../utils/response'

export function errorHandler(err: unknown, c: Context) {
  if (err instanceof HTTPException) {
    return fail(c, err.status, err.message, err.status)
  }
  logError(err, {
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
  })
  const message = env.isProduction ? 'internal error' : (err instanceof Error ? err.message : 'internal error')
  return fail(c, 500, message, 500)
}
