import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { prisma } from '../db/client'
import { fail, ok } from '../utils/response'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

interface RolePermissionPayload {
  permissionCodes: string[]
}

interface IdParams {
  id: string
}

export async function listRoles(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const roles = await prisma.role.findMany({
    orderBy: { code: 'asc' },
  })
  const data = roles.map(role => ({
    id: role.id,
    code: role.code,
    name: role.name,
  }))
  return ok(c, data)
}

export async function updateRolePermissions(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as RolePermissionPayload
  return ok(c, {
    roleId: id,
    permissionCodes: payload.permissionCodes,
    updated: true,
  })
}

export async function getPermissionTree(c: AppContext) {
  return ok(c, [])
}
