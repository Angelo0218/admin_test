import type { AuthPayload } from '../middlewares/auth'
import { listAuditLogs } from '../models/audit'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

export async function listAuditRecords(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery')
  const data = await listAuditLogs(query)
  return c.json({ code: 0, message: 'ok', data })
}
