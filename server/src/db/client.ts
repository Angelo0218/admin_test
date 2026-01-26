import { PrismaClient } from '@prisma/client'
import { env } from '../config/env'

export const prisma = new PrismaClient({
  datasourceUrl: env.databaseUrl,
})

let sqliteConfigured = false

export async function ensureSqlitePragmas() {
  if (sqliteConfigured) {
    return
  }
  sqliteConfigured = true
  if (!env.databaseUrl.startsWith('file:')) {
    return
  }
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL')
  await prisma.$queryRawUnsafe('PRAGMA busy_timeout = 5000')
}
