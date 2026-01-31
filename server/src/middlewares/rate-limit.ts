import type { MiddlewareHandler } from 'hono'

interface RateLimitOptions {
  windowMs: number
  max: number
}

function isRateLimitDisabled() {
  const nodeEnv = globalThis.process?.env ?? {}
  const bunEnv = globalThis.Bun?.env ?? {}
  const envSource = { ...bunEnv, ...nodeEnv }
  return envSource.DISABLE_RATE_LIMIT === '1' || envSource.DISABLE_RATE_LIMIT === 'true'
}

function getClientKey(headerValue: string | undefined) {
  if (!headerValue) {
    return 'unknown'
  }
  return headerValue.split(',')[0]?.trim() || 'unknown'
}

export function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const hits = new Map<string, { count: number, resetAt: number }>()

  return async (c, next) => {
    if (isRateLimitDisabled()) {
      await next()
      return
    }

    const key = getClientKey(c.req.header('x-forwarded-for') || c.req.header('x-real-ip'))
    const now = Date.now()
    const existing = hits.get(key)
    const entry = existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + options.windowMs }

    entry.count += 1
    hits.set(key, entry)

    if (entry.count > options.max) {
      return c.json({ success: false, code: 429, message: 'too many requests', data: null }, 429)
    }

    await next()
  }
}
