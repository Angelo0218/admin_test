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
  const trimmed = raw.split('?')[0]?.split('#')[0] ?? ''
  if (!trimmed) {
    return null
  }
  const normalized = trimmed.replace(/^\/+/, '')
  const isWindowsBase = path.win32.isAbsolute(baseDir)
  const usesPosixSeparators = isWindowsBase && baseDir.includes('/')
  const normalizeWindowsSeparators = (value: string) =>
    usesPosixSeparators ? value.replace(/\\/g, '/') : value
  const isAbsolute = path.isAbsolute(normalized) || path.win32.isAbsolute(normalized)
  if (isAbsolute) {
    const absolutePath = path.win32.isAbsolute(normalized)
      ? path.win32.normalize(normalized)
      : path.normalize(normalized)
    return normalizeWindowsSeparators(absolutePath)
  }
  const resolved = isWindowsBase
    ? path.win32.resolve(baseDir, normalized)
    : path.resolve(baseDir, normalized)
  return normalizeWindowsSeparators(resolved)
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
