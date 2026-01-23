import type { AuthPayload } from '../middlewares/auth'
import { getPermissionTree as getPermissionTreeModel, isPathAllowed } from '../models/permission'

export async function getPermissionTree(c) {
  const auth = c.get('user') as AuthPayload
  const tree = getPermissionTreeModel(auth.role)
  return c.json({ code: 0, message: 'ok', data: tree })
}

export async function validateMenuPath(c) {
  const auth = c.get('user') as AuthPayload
  const { path } = c.get('validatedBody')
  const allowed = isPathAllowed(path, auth.role)
  return c.json({ code: 0, message: 'ok', data: allowed })
}
