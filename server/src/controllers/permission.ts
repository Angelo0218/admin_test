import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { getPermissionTree as getPermissionTreeModel, isPathAllowed } from '../models/permission'

interface PermissionValidatePayload {
  path: string
}

export async function getPermissionTree(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  const tree = getPermissionTreeModel(auth.role)
  return c.json({ code: 0, message: 'ok', data: tree })
}

export async function validateMenuPath(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  const { path } = c.get('validatedBody') as PermissionValidatePayload
  const allowed = isPathAllowed(path, auth.role)
  return c.json({ code: 0, message: 'ok', data: allowed })
}
