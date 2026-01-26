import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl() {
  const envSource = {
    ...(globalThis.Bun?.env ?? {}),
    ...(globalThis.process?.env ?? {}),
  }
  return envSource.DATABASE_URL ?? 'file:./dev.db'
}

const databaseUrl = resolveDatabaseUrl()

export const prisma = new PrismaClient({
  datasourceUrl: databaseUrl,
})

let sqliteConfigured = false

export async function ensureSqlitePragmas() {
  if (sqliteConfigured) {
    return
  }
  sqliteConfigured = true
  if (!databaseUrl.startsWith('file:')) {
    return
  }
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 15000')
}
