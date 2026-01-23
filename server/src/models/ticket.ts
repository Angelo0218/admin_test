import { prisma } from '../db/client'

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

export async function listTickets({ status, category, keyword, page, pageSize }) {
  const where: Record<string, any> = {}
  if (status) {
    where.status = status
  }
  if (category) {
    where.category = category
  }
  if (keyword) {
    where.OR = [
      { subject: { contains: keyword } },
      { requester: { is: { displayName: { contains: keyword } } } },
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: { select: { displayName: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ])

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
    page,
    pageSize,
    total,
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
    messages: ticket.messages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender?.displayName || '',
      message: message.message,
      createdAt: message.createdAt.toISOString(),
    })),
  }
}

export async function createTicket({ requesterId, subject, category, tags, internalNote }) {
  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { id: true },
  })
  if (!requester) {
    return null
  }
  const ticket = await prisma.ticket.create({
    data: {
      requesterId,
      subject,
      category,
      tags: serializeTags(tags),
      internalNote: internalNote || undefined,
      status: 'WAITING',
    },
  })

  return {
    id: ticket.id,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
  }
}

export async function addTicketMessage({ ticketId, senderId, message }) {
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

export async function updateTicketStatus({ ticketId, status }) {
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

export async function updateTicketMeta({ ticketId, tags, internalNote }) {
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

function isValidTicketTransition(current: string, next: string) {
  if (current === 'WAITING') {
    return next === 'IN_PROGRESS'
  }
  if (current === 'IN_PROGRESS') {
    return next === 'CLOSED'
  }
  return false
}
