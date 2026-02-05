import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { createAuditLog } from '../models/audit'
import {
  createUserAccount,
  deleteUserAccount,
  findUserById,
  listUsers,
  mapUserResponse,
  updateUserPassword,
} from '../models/user'
import { hashPassword, verifyPassword } from '../utils/password'
import { fail, ok } from '../utils/response'
import { isAdmin } from '../utils/role'

interface UserListQuery {
  keyword?: string
}

interface UserCreatePayload {
  username: string
  password: string
  displayName: string
  roleCode: string
}

interface UserDeletePayload {
  adminPassword: string
}

interface UserPasswordChangePayload {
  currentPassword: string
  newPassword: string
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
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const query = c.get('validatedQuery') as UserListQuery
  const data = await listUsers(query)
  return ok(c, data)
}

export async function getUserById(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
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

export async function createUserAccountHandler(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const payload = c.get('validatedBody') as UserCreatePayload
  const user = await createUserAccount(payload)
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_CREATE',
    targetType: 'USER',
    targetId: user.id,
    meta: { roleCode: payload.roleCode },
  })
  return ok(c, { id: user.id })
}

export async function deleteUserAccountHandler(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as UserDeletePayload
  const admin = await findUserById(auth.userId)
  if (!admin) {
    return fail(c, 404, 'user not found', 404)
  }
  const isValid = await verifyPassword(payload.adminPassword, admin.passwordHash)
  if (!isValid) {
    return fail(c, 401, 'invalid admin password', 401)
  }
  const user = await deleteUserAccount(id)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_DELETE',
    targetType: 'USER',
    targetId: id,
  })
  return ok(c, { id: user.id, status: user.status })
}

export async function changePasswordHandler(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  const payload = c.get('validatedBody') as UserPasswordChangePayload
  const user = await findUserById(auth.userId)
  if (!user) {
    return fail(c, 404, 'user not found', 404)
  }
  const isValid = await verifyPassword(payload.currentPassword, user.passwordHash)
  if (!isValid) {
    return fail(c, 401, 'invalid current password', 401)
  }
  const passwordHash = await hashPassword(payload.newPassword)
  await updateUserPassword(user.id, passwordHash)
  await createAuditLog({
    actorId: auth.userId,
    action: 'USER_PASSWORD_CHANGE',
    targetType: 'USER',
    targetId: user.id,
  })
  return ok(c, true)
}
