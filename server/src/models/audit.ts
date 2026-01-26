import { prisma } from '../db/client'

export interface AuditCreateParams {
  actorId: string
  action: string
  targetType: string
  targetId: string
  meta?: unknown
}

export async function listAuditLogs() {
  const items = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { displayName: true } },
    },
  })

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
  }
}

export async function createAuditLog({ actorId, action, targetType, targetId, meta }: AuditCreateParams) {
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

function safeParseMeta(raw: string): unknown {
  try {
    return JSON.parse(raw)
  }
  catch {
    return raw
  }
}
