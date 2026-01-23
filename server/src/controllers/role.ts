import type { AuthPayload } from '../middlewares/auth'
import { prisma } from '../db/client'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

export async function listRoles(c) {
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

export async function updateRolePermissions(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
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
