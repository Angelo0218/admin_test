import { prisma } from '../db/client'

export interface TicketMessageParams {
  ticketId: string
  senderId: string
  message: string
}

export interface TicketStatusParams {
  ticketId: string
  status: string
}

export interface TicketMetaParams {
  ticketId: string
  tags?: string[]
  internalNote?: string
}

function serializeTags(tags?: string[]) {
  if (!tags) {
    return null
  }
  return JSON.stringify(tags)
}

function parseTags(raw?: string | null) {
  if (!raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return raw.split(',').map(item => item.trim()).filter(Boolean)
  }
}

export async function listTickets() {
  const items = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      requester: { select: { displayName: true } },
    },
  })

  return {
    items: items.map(item => ({
      id: item.id,
      subject: item.subject,
      category: item.category,
      status: item.status,
      tags: parseTags(item.tags),
      requesterName: item.requester?.displayName || '',
      createdAt: item.createdAt.toISOString(),
    })),
    page: 1,
    pageSize: items.length,
    total: items.length,
  }
}

export async function getTicketDetail(id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { displayName: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { displayName: true } },
        },
      },
    },
  })

  if (!ticket) {
    return null
  }

  const availableActions = getTicketAvailableActions(ticket.status)
  const availableStatuses = getTicketAvailableStatuses(ticket.status)

  return {
    ticket: {
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      tags: parseTags(ticket.tags),
      internalNote: ticket.internalNote || undefined,
      requesterName: ticket.requester?.displayName || '',
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    },
    availableActions,
    availableStatuses,
    messages: ticket.messages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender?.displayName || '',
      message: message.message,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

export async function addTicketMessage({ ticketId, senderId, message }: TicketMessageParams) {
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  })
  if (!existing) {
    return null
  }
  const created = await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId,
      message,
    },
  })

  return {
    id: created.id,
    createdAt: created.createdAt.toISOString(),
  }
}

export async function updateTicketStatus({ ticketId, status }: TicketStatusParams) {
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  })
  if (!existing) {
    return null
  }
  if (!isValidTicketTransition(existing.status, status)) {
    return { error: 'INVALID_STATUS' }
  }
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status },
  })
  return {
    id: ticket.id,
    status: ticket.status,
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

export async function updateTicketMeta({ ticketId, tags, internalNote }: TicketMetaParams) {
  const existing = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  })
  if (!existing) {
    return null
  }
  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      tags: tags ? serializeTags(tags) : undefined,
      internalNote: internalNote || undefined,
    },
  })
  return {
    id: ticket.id,
    tags: parseTags(ticket.tags),
    internalNote: ticket.internalNote || undefined,
    updatedAt: ticket.updatedAt.toISOString(),
  }
}

// 工單狀態轉移規則：後端為唯一準則，前端僅做提示與避免 400.
const TICKET_TRANSITIONS: Record<string, string[]> = {
  WAITING: ['IN_PROGRESS'],
  IN_PROGRESS: ['CLOSED'],
}

export function getTicketAvailableActions(status: string) {
  return TICKET_TRANSITIONS[status] ?? []
}

export function getTicketAvailableStatuses(status: string) {
  return getTicketAvailableActions(status)
}

function isValidTicketTransition(current: string, next: string) {
  return TICKET_TRANSITIONS[current]?.includes(next) ?? false
}
