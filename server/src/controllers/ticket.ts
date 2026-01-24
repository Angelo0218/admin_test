import type { AuthPayload } from '../middlewares/auth'
import type { AppContext } from '../types/context'
import { createAuditLog } from '../models/audit'
import {
  addTicketMessage,
  createTicket,
  getTicketDetail,
  listTickets,
  updateTicketMeta,
  updateTicketStatus,
} from '../models/ticket'
import { fail, ok } from '../utils/response'

function ensureTicketRole(role: string) {
  return role === 'ADMIN' || role === 'SUPPORT'
}

interface TicketListQuery {
  status?: string
  category?: string
  keyword?: string
  page: number
  pageSize: number
}

interface TicketCreatePayload {
  requesterId: string
  subject: string
  category: string
  tags: string[]
  internalNote?: string
}

interface TicketReplyPayload {
  message: string
}

interface TicketStatusPayload {
  status: string
}

interface TicketUpdatePayload {
  tags?: string[]
  internalNote?: string
}

interface IdParams {
  id: string
}

export async function listTicketItems(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const query = c.get('validatedQuery') as TicketListQuery
  const data = await listTickets(query)
  return ok(c, data)
}

export async function getTicketInfo(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const data = await getTicketDetail(id)
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  return ok(c, data)
}

export async function createTicketItem(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const payload = c.get('validatedBody') as TicketCreatePayload
  const data = await createTicket(payload)
  if (!data) {
    return fail(c, 404, 'user not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_CREATE',
    targetType: 'TICKET',
    targetId: data.id,
    meta: payload,
  })
  return ok(c, data)
}

export async function replyTicket(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as TicketReplyPayload
  const data = await addTicketMessage({
    ticketId: id,
    senderId: auth.userId,
    message: payload.message,
  })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_REPLY',
    targetType: 'TICKET',
    targetId: id,
    meta: { message: payload.message },
  })
  return ok(c, data)
}

export async function changeTicketStatus(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as TicketStatusPayload
  const data = await updateTicketStatus({ ticketId: id, status: payload.status })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return fail(c, 400, 'invalid status transition', 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_STATUS',
    targetType: 'TICKET',
    targetId: id,
    meta: payload,
  })
  return ok(c, data)
}

export async function updateTicketInfo(c: AppContext) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return fail(c, 403, 'forbidden', 403)
  }
  const { id } = c.get('validatedParams') as IdParams
  const payload = c.get('validatedBody') as TicketUpdatePayload
  const data = await updateTicketMeta({
    ticketId: id,
    tags: payload.tags,
    internalNote: payload.internalNote,
  })
  if (!data) {
    return fail(c, 404, 'not found', 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_UPDATE',
    targetType: 'TICKET',
    targetId: id,
    meta: payload,
  })
  return ok(c, data)
}
