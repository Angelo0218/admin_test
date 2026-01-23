import { prisma } from '../db/client'

export async function listAuditLogs({ action, targetType, keyword, page, pageSize }) {
  const where: Record<string, any> = {}
  if (action) {
    where.action = action
  }
  if (targetType) {
    where.targetType = targetType
  }
  if (keyword) {
    where.OR = [
      { targetId: { contains: keyword } },
      { action: { contains: keyword } },
    ]
  }

  const skip = (page - 1) * pageSize
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { displayName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    items: items.map(item => ({
      id: item.id,
      actorName: item.actor?.displayName || '',
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      meta: item.meta ? safeParseMeta(item.meta) : undefined,
      createdAt: item.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
  }
}

export async function createAuditLog({ actorId, action, targetType, targetId, meta }) {
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  })
}

function safeParseMeta(raw: string) {
  try {
    return JSON.parse(raw)
  }
  catch {
    return raw
  }
}
