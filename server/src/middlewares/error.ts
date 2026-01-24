import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { env } from '../config/env'
import { logError } from '../utils/logger'

export function errorHandler(err: unknown, c: Context) {
  if (err instanceof HTTPException) {
    return c.json({ code: err.status, message: err.message, data: null }, err.status)
  }
  logError(err, {
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
  })
  const message = env.isProduction ? 'internal error' : (err instanceof Error ? err.message : 'internal error')
  return c.json({ code: 500, message, data: null }, 500)
}
