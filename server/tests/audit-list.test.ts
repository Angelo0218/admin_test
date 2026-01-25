import { expect, test } from 'bun:test'
import { prisma } from '../src/db/client'
import { listAuditLogs } from '../src/models/audit'

test('listAuditLogs uses defaults when params are omitted', async () => {
  const originalFindMany = prisma.auditLog.findMany
  const originalCount = prisma.auditLog.count
  const originalTransaction = prisma.$transaction
  const captured = { findMany: undefined, count: undefined }

  prisma.auditLog.findMany = (args) => {
    captured.findMany = args
    return { placeholder: 'findMany' }
  }
  prisma.auditLog.count = (args) => {
    captured.count = args
    return { placeholder: 'count' }
  }
  prisma.$transaction = (_requests) => {
    return Promise.resolve([[], 0])
  }

  try {
    const result = await listAuditLogs()
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(captured.findMany.skip).toBe(0)
    expect(captured.findMany.take).toBe(20)
    expect(captured.count).toEqual({ where: {} })
  }
  finally {
    prisma.auditLog.findMany = originalFindMany
    prisma.auditLog.count = originalCount
    prisma.$transaction = originalTransaction
  }
})
