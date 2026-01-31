import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthPayload {
  userId: string
  role: string
  username: string
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const header = c.req.header('Authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return c.json({ success: false, code: 401, message: 'unauthorized', data: null }, 401)
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload
    c.set('user', payload)
    await next()
  }
  catch {
    return c.json({ success: false, code: 401, message: 'invalid token', data: null }, 401)
  }
})
