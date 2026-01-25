import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logError } from '../utils/logger'
import { fail } from '../utils/response'

function isProductionRuntime() {
  const nodeEnv = globalThis.process?.env ?? {}
  const bunEnv = globalThis.Bun?.env ?? {}
  const envSource = { ...bunEnv, ...nodeEnv }
  const nodeEnvValue = envSource.NODE_ENV ?? 'development'
  return nodeEnvValue === 'production' || envSource.CI === 'true' || envSource.CI === '1'
}

export function errorHandler(err: unknown, c: Context) {
  if (err instanceof HTTPException) {
    return fail(c, err.status, err.message, err.status)
  }
  logError(err, {
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
  })
  const message = isProductionRuntime() ? 'internal error' : (err instanceof Error ? err.message : 'internal error')
  return fail(c, 500, message, 500)
}
