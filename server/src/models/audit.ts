import type { Prisma } from '@prisma/client'
import { prisma } from '../db/client'

export interface AuditListParams {
  action?: string
  targetType?: string
  keyword?: string
  page: number
  pageSize: number
}

export interface AuditCreateParams {
  actorId: string
  action: string
  targetType: string
  targetId: string
  meta?: unknown
}

export function buildAuditWhere({ action, targetType, keyword }: Pick<AuditListParams, 'action' | 'targetType' | 'keyword'> = {}) {
  const where: Prisma.AuditLogWhereInput = {}

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
      { actor: { displayName: { contains: keyword } } },
    ]
  }

  return where
}

export async function listAuditLogs(params: Partial<AuditListParams> = {}) {
  const { action, targetType, keyword } = params
  const page = Number.isFinite(params.page) && Number(params.page) > 0 ? Number(params.page) : 1
  const pageSize = Number.isFinite(params.pageSize) && Number(params.pageSize) > 0 ? Number(params.pageSize) : 20
  const where = buildAuditWhere({ action, targetType, keyword })

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
