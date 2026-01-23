import type { AuthPayload } from '../middlewares/auth'
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

export async function listKycApplications(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery')
  const data = await listApplications(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function createKycApplication(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const payload = c.get('validatedBody')
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

export async function getKycDetail(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const data = await getApplicationDetail(id)
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  return c.json({ code: 0, message: 'ok', data })
}

export async function reviewKycApplication(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
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

export async function listKycAppeals(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery')
  const data = await listAppeals(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function createKycAppeal(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureAdmin(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
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

export async function resolveKycAppeal(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureKycRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
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
