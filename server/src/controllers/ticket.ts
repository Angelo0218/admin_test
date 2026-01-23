import type { AuthPayload } from '../middlewares/auth'
import { createAuditLog } from '../models/audit'
import {
  addTicketMessage,
  createTicket,
  getTicketDetail,
  listTickets,
  updateTicketMeta,
  updateTicketStatus,
} from '../models/ticket'

function ensureTicketRole(role: string) {
  return role === 'ADMIN' || role === 'SUPPORT'
}

export async function listTicketItems(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const query = c.get('validatedQuery')
  const data = await listTickets(query)
  return c.json({ code: 0, message: 'ok', data })
}

export async function getTicketInfo(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const data = await getTicketDetail(id)
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  return c.json({ code: 0, message: 'ok', data })
}

export async function createTicketItem(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const payload = c.get('validatedBody')
  const data = await createTicket(payload)
  if (!data) {
    return c.json({ code: 404, message: 'user not found', data: null }, 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_CREATE',
    targetType: 'TICKET',
    targetId: data.id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function replyTicket(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
  const data = await addTicketMessage({
    ticketId: id,
    senderId: auth.userId,
    message: payload.message,
  })
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_REPLY',
    targetType: 'TICKET',
    targetId: id,
    meta: { message: payload.message },
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function changeTicketStatus(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
  const data = await updateTicketStatus({ ticketId: id, status: payload.status })
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  if (data.error === 'INVALID_STATUS') {
    return c.json({ code: 400, message: 'invalid status transition', data: null }, 400)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_STATUS',
    targetType: 'TICKET',
    targetId: id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}

export async function updateTicketInfo(c) {
  const auth = c.get('user') as AuthPayload
  if (!ensureTicketRole(auth.role)) {
    return c.json({ code: 403, message: 'forbidden', data: null }, 403)
  }
  const { id } = c.get('validatedParams')
  const payload = c.get('validatedBody')
  const data = await updateTicketMeta({
    ticketId: id,
    tags: payload.tags,
    internalNote: payload.internalNote,
  })
  if (!data) {
    return c.json({ code: 404, message: 'not found', data: null }, 404)
  }
  await createAuditLog({
    actorId: auth.userId,
    action: 'TICKET_UPDATE',
    targetType: 'TICKET',
    targetId: id,
    meta: payload,
  })
  return c.json({ code: 0, message: 'ok', data })
}
