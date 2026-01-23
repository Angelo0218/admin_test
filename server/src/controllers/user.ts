import type { AuthPayload } from '../middlewares/auth'
import { createAuditLog } from '../models/audit'
import {
  disableUser,
  enableUser,
  findUserById,
  listUsers,
  mapUserResponse,
  resetUserPassword,
} from '../models/user'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

export async function getCurrentUser(c) {
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  const data = mapUserResponse(user, auth.role)
  return c.json({ code: 0, message: 'ok', data })
}

export async function listUserAccounts(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery')
  const data = await listUsers(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function getUserById(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const user = await findUserById(id)
  if (!user) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  const data = mapUserResponse(user)
  return c.json({ code: 0, message: 'ok', data })
}

export async function disableUserAccount(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
  const user = await disableUser({ id, reason: payload.reason })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_DISABLE',
    targetType: 'USER',
    targetId: id,
    meta: { reason: payload.reason },
  })
  return c.json({ code: 0, message: 'ok', data: { id: user.id, status: user.status } })
}

export async function enableUserAccount(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const user = await enableUser({ id })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_ENABLE',
    targetType: 'USER',
    targetId: id,
  })
  return c.json({ code: 0, message: 'ok', data: { id: user.id, status: user.status } })
}

export async function resetUserPasswordHandler(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
  const password = payload.password || '123456'
  await resetUserPassword({ id, password })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_RESET_PASSWORD',
    targetType: 'USER',
    targetId: id,
  })
  return c.json({ code: 0, message: 'ok', data: { id } })
}
