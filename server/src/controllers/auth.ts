import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { env } from '../config/env'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../models/auth'
import { findUserById, findUserByUsername, mapUserResponse } from '../models/user'
import { verifyPassword } from '../utils/password'
import { fail, ok } from '../utils/response'

interface LoginPayload {
  username: string
  password: string
}

interface RoleTogglePayload {
  role: 'ADMIN' | 'SUPPORT' | 'AUDITOR'
}

export async function login(c: AppContext) {
  const { username, password } = c.get('validatedBody') as LoginPayload
  const user = await findUserByUsername(username)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return fail(c, 401, 'invalid credentials', 401)
  }
  if (user.status === 'DISABLED' || user.status === 'DELETED') {
    return fail(c, 403, 'user disabled', 403)
  }

  const roles = user.roles.map(item => item.role)
  const currentRole = roles.find(role => role.code === 'ADMIN') || roles[0]
  if (!currentRole) {
    return fail(c, 403, 'role not assigned', 403)
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: currentRole.code,
    username: user.username,
  }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const isSecure = env.isProduction

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: isSecure ? 'None' : 'Lax',
    secure: isSecure,
    maxAge: 60 * 60 * 24 * 7,
    path: '/api/v1/auth/refresh/token',
  })

  return ok(c, { accessToken })
}

export function readRefreshTokenCookie(c: AppContext) {
  return getCookie(c, 'refreshToken') || ''
}

export async function refreshToken(c: AppContext) {
  const token = readRefreshTokenCookie(c)
  if (!token) {
    return fail(c, 401, 'missing refresh token', 401)
  }

  try {
    const payload = verifyRefreshToken(token)
    const accessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
      username: payload.username,
    })
    return ok(c, { accessToken })
  }
  catch (error) {
    console.warn('refresh token verify failed', error)
    return fail(c, 401, 'invalid refresh token', 401)
  }
}

export async function logout(c: AppContext) {
  deleteCookie(c, 'refreshToken', { path: '/api/v1/auth/refresh/token' })
  return ok(c, true)
}

export async function toggleRole(c: AppContext) {
  const { role } = c.get('validatedBody') as RoleTogglePayload
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  const roles = user.roles.map(item => item.role)
  const targetRole = roles.find(item => item.code === role)
  if (!targetRole) {
    return fail(c, 403, 'role not allowed', 403)
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: targetRole.code,
    username: user.username,
  }

  const accessToken = signAccessToken(payload)
  return ok(c, { accessToken })
}

export async function currentUser(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  const data = mapUserResponse(user, auth.role)
  return ok(c, data)
}
