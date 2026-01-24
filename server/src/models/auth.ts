import type { SignOptions } from 'jsonwebtoken'
import type { AuthPayload } from '../middlewares/auth'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function signAccessToken(payload: AuthPayload) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }
  return jwt.sign(payload, env.jwtSecret, options)
}

export function signRefreshToken(payload: AuthPayload) {
  const options: SignOptions = { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] }
  return jwt.sign(payload, env.jwtSecret, options)
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthPayload
}
