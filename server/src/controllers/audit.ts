import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { listAuditLogs } from '../models/audit'
import { fail, ok } from '../utils/response'
import { isAdmin } from '../utils/role'

export async function listAuditRecords(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const data = await listAuditLogs()
  return ok(c, data)
}
