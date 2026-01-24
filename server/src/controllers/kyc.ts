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

function ensureKycRole(role: string) {
  return role === 'ADMIN' || role === 'AUDITOR'
}

function ensureAdmin(role: string) {
  return role === 'ADMIN'
}

interface KycListQuery {
  status?: string
  keyword?: string
  page: number
  pageSize: number
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

interface KycAppealListQuery {
  status?: string
  keyword?: string
  page: number
  pageSize: number
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
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery') as KycListQuery
  const data = await listApplications(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function createKycApplication(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const payload = c.get('validatedBody') as KycCreatePayload
  const data = await createApplication(payload)
  if (!data) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'KYC_CREATE',
    targetType: 'KYC_APPLICATION',
    targetId: data.id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function getKycDetail(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const data = await getApplicationDetail(id)
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  return c.json({ code: 0, message: 'ok', data })
}

export async function reviewKycApplication(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
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
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return c.json({ code: 400, message: 'invalid status transition', data: null }, 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: `KYC_${payload.action}`,
    targetType: 'KYC_APPLICATION',
    targetId: id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function listKycAppeals(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery') as KycAppealListQuery
  const data = await listAppeals(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function createKycAppeal(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as KycAppealCreatePayload
  const data = await createAppeal({ applicationId: id, reason: payload.reason })
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'KYC_APPEAL_CREATE',
    targetType: 'KYC_APPEAL',
    targetId: data.id,
    meta: { applicationId: id, reason: payload.reason },
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function resolveKycAppeal(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
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
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return c.json({ code: 400, message: 'invalid status transition', data: null }, 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: `KYC_APPEAL_${payload.status}`,
    targetType: 'KYC_APPEAL',
    targetId: id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}
