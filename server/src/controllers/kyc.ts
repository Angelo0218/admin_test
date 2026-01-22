import type { AuthPayload } from '../middlewares/auth'
import { assignApplication, auditApplication, getApplicationDetail, listApplications, listAuditors, listHistory, resetApplication } from '../models/kyc'

function requireSuperAdmin(role) {
  return role === 'SUPER_ADMIN'
}

export async function getApplications(c) {
  const query = c.get('validatedQuery')
  const auth = c.get('user') as AuthPayload
  const data = await listApplications({
    ...query,
    assignedTo: auth.role === 'SUPER_ADMIN' ? undefined : query.assignedTo,
    userId: auth.userId,
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function getApplicationDetailHandler(c) {
  const { id } = c.get('validatedParams')
  const data = await getApplicationDetail(id)
  if (!data) {
    return c.json({ code: 404, message: 'application not found', data: null }, 404)
  }
  return c.json({ code: 0, message: 'ok', data })
}

export async function auditApplicationHandler(c) {
  const { id } = c.get('validatedParams')
  const { decision, comment } = c.get('validatedBody')
  const auth = c.get('user') as AuthPayload

  const data = await auditApplication({
    id,
    decision,
    comment,
    auditorId: auth.userId,
  })

  return c.json({ code: 0, message: 'ok', data })
}

export async function assignApplicationHandler(c) {
  const { id } = c.get('validatedParams')
  const { auditorId } = c.get('validatedBody')
  const auth = c.get('user') as AuthPayload

  if (!requireSuperAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }

  const result = await assignApplication({ id, auditorId })
  if (result === null) {
    return c.json({ code: 404, message: 'auditor not found', data: null }, 404)
  }
  if (result === undefined) {
    return c.json({ code: 400, message: 'invalid auditor', data: null }, 400)
  }

  return c.json({ code: 0, message: 'ok', data: result })
}

export async function resetApplicationHandler(c) {
  const { id } = c.get('validatedParams')
  const { reason } = c.get('validatedBody')
  const auth = c.get('user') as AuthPayload

  if (!requireSuperAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }

  const data = await resetApplication({
    id,
    reason,
    auditorId: auth.userId,
  })

  return c.json({ code: 0, message: 'ok', data })
}

export async function getHistory(c) {
  const query = c.get('validatedQuery')
  const data = await listHistory(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function getAuditors(c) {
  const data = await listAuditors()
  return c.json({ code: 0, message: 'ok', data })
}
