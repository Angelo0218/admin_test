import type { MiddlewareHandler } from 'hono'
import { randomUUID } from 'node:crypto'

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const incoming = c.req.header('x-request-id')
  const requestId = incoming || randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)
  await next()
}
