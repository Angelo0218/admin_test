import type { MiddlewareHandler } from 'hono'

const CSP = 'default-src \'self\'; frame-ancestors \'none\''
const HSTS = 'max-age=31536000; includeSubDomains'

function isSecureRequest(url: string, forwardedProto?: string | null) {
  if (forwardedProto) {
    return forwardedProto.toLowerCase() === 'https'
  }
  try {
    return new URL(url).protocol === 'https:'
  }
  catch {
    return false
  }
}

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  const forwardedProto = c.req.header('x-forwarded-proto')
  const secure = isSecureRequest(c.req.url, forwardedProto)

  c.header('Content-Security-Policy', CSP)
  c.header('X-Frame-Options', 'DENY')
  c.header('X-Content-Type-Options', 'nosniff')
  if (secure) {
    c.header('Strict-Transport-Security', HSTS)
  }

  await next()
}
