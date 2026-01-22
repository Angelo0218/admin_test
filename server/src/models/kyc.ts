import { prisma } from '../db/client'

export async function listApplications({ status, assignedTo, userId, page, pageSize }) {
  const where: Record<string, any> = {}
  if (status) {
    where.status = status
  }
  if (assignedTo === 'me' && userId) {
    where.assignedAuditorId = userId
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await prisma.$transaction([
    prisma.kycApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { submittedAt: 'desc' },
      include: {
        assignedAuditor: {
          select: { displayName: true },
        },
      },
    }),
    prisma.kycApplication.count({ where }),
  ])

  const mapped = items.map(item => ({
    id: item.id,
    fullName: item.fullName,
    idNumber: item.idNumber,
    status: item.status,
    submittedAt: item.submittedAt.toISOString(),
    assignedAuditorId: item.assignedAuditorId || undefined,
    assignedAuditorName: item.assignedAuditor?.displayName || undefined,
  }))

  return {
    items: mapped,
    page,
    pageSize,
    total,
  }
}

export async function getApplicationDetail(id) {
  const application = await prisma.kycApplication.findUnique({
    where: { id },
    include: {
      documents: true,
      assignedAuditor: {
        select: { displayName: true },
      },
      auditRecords: {
        orderBy: { createdAt: 'desc' },
        include: {
          auditor: {
            select: { displayName: true },
          },
        },
      },
    },
  })

  if (!application) {
    return null
  }

  return {
    application: {
      id: application.id,
      userId: application.userId,
      fullName: application.fullName,
      idNumber: application.idNumber,
      status: application.status,
      submittedAt: application.submittedAt.toISOString(),
      assignedAuditorId: application.assignedAuditorId || undefined,
      assignedAuditorName: application.assignedAuditor?.displayName || undefined,
      documents: application.documents.map(doc => ({
        id: doc.id,
        type: doc.type,
        url: doc.url,
      })),
    },
    auditHistory: application.auditRecords.map(record => ({
      id: record.id,
      action: record.action,
      auditorId: record.auditorId,
      auditorName: record.auditor?.displayName || '',
      comment: record.comment || undefined,
      createdAt: record.createdAt.toISOString(),
    })),
  }
}

export async function auditApplication({ id, decision, comment, auditorId }) {
  const application = await prisma.kycApplication.update({
    where: { id },
    data: {
      status: decision,
      auditRecords: {
        create: {
          action: decision,
          auditorId,
          comment: comment || undefined,
        },
      },
    },
  })

  return {
    id: application.id,
    status: application.status,
    auditedAt: application.updatedAt.toISOString(),
  }
}

export async function resetApplication({ id, reason, auditorId }) {
  const application = await prisma.kycApplication.update({
    where: { id },
    data: {
      status: 'RESET',
      auditRecords: {
        create: {
          action: 'RESET',
          auditorId,
          comment: reason || undefined,
        },
      },
    },
  })

  return {
    id: application.id,
    status: application.status,
  }
}

export async function assignApplication({ id, auditorId }) {
  const auditor = await prisma.user.findUnique({
    where: { id: auditorId },
    include: {
      roles: {
        include: { role: true },
      },
    },
  })

  if (!auditor) {
    return null
  }

  const hasAuditorRole = auditor.roles.some(item => item.role.code === 'AUDITOR')
  if (!hasAuditorRole) {
    return undefined
  }

  const application = await prisma.kycApplication.update({
    where: { id },
    data: {
      assignedAuditorId: auditorId,
    },
  })

  return {
    id: application.id,
    assignedAuditorId: application.assignedAuditorId,
    assignedAuditorName: auditor.displayName,
  }
}

export async function listAuditors() {
  const auditors = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          role: { code: 'AUDITOR' },
        },
      },
    },
    select: {
      id: true,
      displayName: true,
    },
    orderBy: { displayName: 'asc' },
  })

  return auditors.map(item => ({
    id: item.id,
    name: item.displayName,
  }))
}

export async function listHistory({ status, auditorId, dateFrom, dateTo, keyword, page, pageSize }) {
  const where: Record<string, any> = {}

  if (status) {
    where.status = status
  }
  else {
    where.status = { in: ['APPROVED', 'REJECTED', 'RESET'] }
  }

  if (keyword) {
    where.OR = [
      { fullName: { contains: keyword } },
      { idNumber: { contains: keyword } },
    ]
  }

  if (dateFrom || dateTo) {
    where.updatedAt = {}
    if (dateFrom) {
      where.updatedAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.updatedAt.lte = new Date(dateTo)
    }
  }

  if (auditorId) {
    where.auditRecords = {
      some: {
        auditorId,
      },
    }
  }

  const skip = (page - 1) * pageSize

  const [items, total] = await prisma.$transaction([
    prisma.kycApplication.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        auditRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            auditor: {
              select: { displayName: true },
            },
          },
        },
      },
    }),
    prisma.kycApplication.count({ where }),
  ])

  const mapped = items.map((item) => {
    const latest = item.auditRecords[0]
    return {
      id: item.id,
      fullName: item.fullName,
      idNumber: item.idNumber,
      status: item.status,
      auditorName: latest?.auditor?.displayName || '',
      updatedAt: item.updatedAt.toISOString(),
    }
  })

  return {
    items: mapped,
    page,
    pageSize,
    total,
  }
}
