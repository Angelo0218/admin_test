import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function errorHandler(err: unknown, c: Context) {
  if (err instanceof HTTPException) {
    return c.json({ code: err.status, message: err.message, data: null }, err.status)
  }
  const message = err instanceof Error ? err.message : 'internal error'
  return c.json({ code: 500, message, data: null }, 500)
}
