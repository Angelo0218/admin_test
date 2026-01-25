import type { SignOptions } from 'jsonwebtoken'
import type { AuthPayload } from '../middlewares/auth'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

function resolveJwtSecret() {
  const bunEnv = globalThis.Bun?.env ?? {}
  const nodeEnv = globalThis.process?.env ?? {}
  return env.jwtSecret || bunEnv.JWT_SECRET || nodeEnv.JWT_SECRET || ''
}

export function signAccessToken(payload: AuthPayload) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }
  return jwt.sign(payload, resolveJwtSecret(), options)
}

export function signRefreshToken(payload: AuthPayload) {
  const options: SignOptions = { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] }
  return jwt.sign(payload, resolveJwtSecret(), options)
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, resolveJwtSecret()) as AuthPayload
}
