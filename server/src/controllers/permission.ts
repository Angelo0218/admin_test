import { isPathAllowed, permissionTree } from '../models/permission'

export async function getPermissionTree(c) {
  return c.json({ code: 0, message: 'ok', data: permissionTree })
}

export async function validateMenuPath(c) {
  const { path } = c.get('validatedBody')
  const allowed = isPathAllowed(path)
  return c.json({ code: 0, message: 'ok', data: allowed })
}
