import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { createAuditLog } from '../models/audit'
import {
  createAppeal,
  createApplication,
  getApplicationDetail,
  listAppeals,
  listApplications,
  resolveAppeal,
  reviewApplication,
} from '../models/kyc'
import { fail, ok } from '../utils/response'
import { isAdmin } from '../utils/role'

function ensureKycRole(role: string) {
  return role === 'ADMIN' || role === 'AUDITOR'
}

interface KycCreatePayload {
  userId: string
  fullName: string
  idNumber: string
  documentType: string
  phone: string
  documents: Array<{ type: string, url: string }>
}

interface KycReviewPayload {
  action: 'PASSED' | 'REJECTED' | 'NEED_MORE'
  comment?: string
}

interface KycAppealCreatePayload {
  reason: string
}

interface KycAppealResolvePayload {
  status: 'APPROVED' | 'REJECTED'
  decisionComment?: string
}

interface IdParams {
  id: string
}

export async function listKycApplications(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const data = await listApplications()
  return ok(c, data)
}

export async function createKycApplication(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const payload = c.get('validatedBody') as KycCreatePayload
  const data = await createApplication(payload)
  if (!data) {
    return fail(c, 404, 'user not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'KYC_CREATE',
    targetType: 'KYC_APPLICATION',
    targetId: data.id,
    meta: payload,
  })
  return ok(c, data)
}

export async function getKycDetail(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const data = await getApplicationDetail(id)
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  return ok(c, data)
}

export async function reviewKycApplication(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as KycReviewPayload
  const data = await reviewApplication({
    id,
    action: payload.action,
    comment: payload.comment,
    reviewerId: auth.userId,
  })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return fail(c, 400, 'invalid status transition', 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: `KYC_${payload.action}`,
    targetType: 'KYC_APPLICATION',
    targetId: id,
    meta: payload,
  })
  return ok(c, data)
}

export async function listKycAppeals(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const data = await listAppeals()
  return ok(c, data)
}

export async function createKycAppeal(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!isAdmin(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as KycAppealCreatePayload
  const data = await createAppeal({ applicationId: id, reason: payload.reason })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'KYC_APPEAL_CREATE',
    targetType: 'KYC_APPEAL',
    targetId: data.id,
    meta: { applicationId: id, reason: payload.reason },
  })
  return ok(c, data)
}

export async function resolveKycAppeal(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as KycAppealResolvePayload
  const data = await resolveAppeal({
    id,
    status: payload.status,
    decisionComment: payload.decisionComment,
    handledById: auth.userId,
  })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return fail(c, 400, 'invalid status transition', 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: `KYC_APPEAL_${payload.status}`,
    targetType: 'KYC_APPEAL',
    targetId: id,
    meta: payload,
  })
  return ok(c, data)
}
