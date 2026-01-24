import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { createAuditLog } from '../models/audit'
import {
  disableUser,
  enableUser,
  findUserById,
  listUsers,
  mapUserResponse,
  resetUserPassword,
} from '../models/user'
import { fail, ok } from '../utils/response'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

interface UserListQuery {
  status?: string
  keyword?: string
  page: number
  pageSize: number
}

interface UserDisablePayload {
  reason: string
}

interface UserResetPasswordPayload {
  password?: string
}

interface IdParams {
  id: string
}

export async function getCurrentUser(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  const data = mapUserResponse(user, auth.role)
  return ok(c, data)
}

export async function listUserAccounts(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const query = c.get('validatedQuery') as UserListQuery
  const data = await listUsers(query)
  return ok(c, data)
}

export async function getUserById(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const user = await findUserById(id)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  const data = mapUserResponse(user)
  return ok(c, data)
}

export async function disableUserAccount(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as UserDisablePayload
  const user = await disableUser({ id, reason: payload.reason })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_DISABLE',
    targetType: 'USER',
    targetId: id,
    meta: { reason: payload.reason },
  })
  return ok(c, { id: user.id, status: user.status })
}

export async function enableUserAccount(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const user = await enableUser({ id })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_ENABLE',
    targetType: 'USER',
    targetId: id,
  })
  return ok(c, { id: user.id, status: user.status })
}

export async function resetUserPasswordHandler(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as UserResetPasswordPayload
  const password = payload.password || '123456'
  await resetUserPassword({ id, password })
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_RESET_PASSWORD',
    targetType: 'USER',
    targetId: id,
  })
  return ok(c, { id })
}
