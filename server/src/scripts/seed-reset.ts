/* global Bun */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedDefaults, seedDemoData } from '../models/seed'

export function resolveDatabasePath(databaseUrl: string | undefined, baseDir: string) {
  if (!databaseUrl || !databaseUrl.startsWith('file:')) {
    return null
  }
  const raw = databaseUrl.replace(/^file:/, '')
  if (!raw) {
    return null
  }
  const normalized = raw.replace(/^\/+/, '')
  const candidate = path.isAbsolute(normalized)
    ? normalized
    : path.resolve(baseDir, normalized)
  return candidate
}

function getPrismaDir() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  return path.resolve(scriptDir, '..', '..', 'prisma')
}

async function runCommand(command: string[], cwd: string) {
  const result = Bun.spawnSync(command, {
    cwd,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  if (result.exitCode !== 0) {
    throw new Error(`Command failed: ${command.join(' ')}`)
  }
}

export async function seedReset() {
  const prismaDir = getPrismaDir()
  const serverDir = path.resolve(prismaDir, '..')
  const databaseUrl = process.env.DATABASE_URL || ''
  const databasePath = resolveDatabasePath(databaseUrl, prismaDir)
  if (!databasePath) {
    throw new Error('DATABASE_URL must be a file: url')
  }

  await fs.rm(databasePath, { force: true })

  await runCommand(['bunx', 'prisma', 'migrate', 'deploy'], serverDir)

  await seedDefaults()
  const result = await seedDemoData()
  return {
    databasePath,
    demo: result,
  }
}

async function run() {
  const result = await seedReset()
  console.warn('[seed:reset]', result)
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
