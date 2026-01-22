import type { AuthPayload } from '../middlewares/auth'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
}

export function signRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtRefreshExpiresIn })
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthPayload
}
