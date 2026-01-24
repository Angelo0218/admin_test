import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { listAuditLogs } from '../models/audit'

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

interface AuditListQuery {
  action?: string
  targetType?: string
  keyword?: string
  page: number
  pageSize: number
}

export async function listAuditRecords(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery') as AuditListQuery
  const data = await listAuditLogs(query)
  return c.json({ code: 0, message: 'ok', data })
}
