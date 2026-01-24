import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { prisma } from '../db/client'

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
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const roles = await prisma.role.findMany({
    orderBy: { code: 'asc' },
  })
  const data = roles.map(role => ({
    id: role.id,
    code: role.code,
    name: role.name,
  }))
  return c.json({ code: 0, message: 'ok', data })
}

export async function updateRolePermissions(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as RolePermissionPayload
  return c.json({
    code: 0,
    message: 'ok',
    data: {
      roleId: id,
      permissionCodes: payload.permissionCodes,
      updated: true,
    },
  })
}
