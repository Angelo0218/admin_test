import { expect, test } from 'bun:test'
import { prisma } from '../src/db/client'
import { listAuditLogs } from '../src/models/audit'

test('listAuditLogs uses defaults when params are omitted', async () => {
  const originalFindMany = prisma.auditLog.findMany
  const captured = { findMany: undefined }

  prisma.auditLog.findMany = (args) => {
    captured.findMany = args
    return []
  }

  try {
    const result = await listAuditLogs()
    expect(result.items).toEqual([])
    expect(captured.findMany.orderBy).toEqual({ createdAt: 'desc' })
  }
  finally {
    prisma.auditLog.findMany = originalFindMany
  }
})
