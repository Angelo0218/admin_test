import type { AuthPayload } from '../middlewares/auth'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { env } from '../config/env'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../models/auth'
import { findUserById, findUserByUsername, mapUserResponse } from '../models/user'

export async function login(c) {
  const { username, password } = c.get('validatedBody')
  const user = await findUserByUsername(username)
  if (!user || user.passwordHash !== password) {
    return c.json({ code: 401, message: 'invalid credentials', data: null }, 401)
  }
  if (user.status === 'DISABLED') {
    return c.json({ code: 403, message: 'user disabled', data: null }, 403)
  }

  const roles = user.roles.map(item => item.role)
  const currentRole = roles.find(role => role.code === 'ADMIN') || roles[0]
  if (!currentRole) {
    return c.json({ code: 403, message: 'role not assigned', data: null }, 403)
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: currentRole.code,
    username: user.username,
  }

  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  setCookie(c, 'refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/api/v1/auth/refresh/token',
  })

  return c.json({ code: 0, message: 'ok', data: { accessToken } })
}

function extractRefreshToken(c) {
  const header = c.req.header('Cookie') || ''
  const match = header.match(/refreshToken=([^;]+)/)
  const raw = match?.[1] || getCookie(c, 'refreshToken') || ''
  return decodeURIComponent(raw)
    .replace(/\s/g, '')
    .trim()
    .replace(/^"|"$/g, '')
}

export async function refreshToken(c) {
  const token = extractRefreshToken(c)
  if (!token) {
    return c.json({ code: 401, message: 'missing refresh token', data: null }, 401)
  }

  try {
    const payload = verifyRefreshToken(token)
    const accessToken = signAccessToken({
      userId: payload.userId,
      role: payload.role,
      username: payload.username,
    })
    return c.json({ code: 0, message: 'ok', data: { accessToken } })
  }
  catch (error) {
    console.warn('refresh token verify failed', error)
    const data = env.debugAuth
      ? { tokenLength: token.length, tokenPreview: token.slice(0, 16) }
      : null
    return c.json({ code: 401, message: 'invalid refresh token', data }, 401)
  }
}

export async function logout(c) {
  deleteCookie(c, 'refreshToken', { path: '/api/v1/auth/refresh/token' })
  return c.json({ code: 0, message: 'ok', data: true })
}

export async function toggleRole(c) {
  const { role } = c.get('validatedBody')
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  const roles = user.roles.map(item => item.role)
  const targetRole = roles.find(item => item.code === role)
  if (!targetRole) {
    return c.json({ code: 403, message: 'role not allowed', data: null }, 403)
  }

  const payload: AuthPayload = {
    userId: user.id,
    role: targetRole.code,
    username: user.username,
  }

  const accessToken = signAccessToken(payload)
  return c.json({ code: 0, message: 'ok', data: { accessToken } })
}

export async function currentUser(c) {
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  const data = mapUserResponse(user, auth.role)
  return c.json({ code: 0, message: 'ok', data })
}
