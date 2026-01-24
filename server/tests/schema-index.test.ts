import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'bun:test'

const here = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(here, '..', 'prisma', 'schema.prisma')
const schema = readFileSync(schemaPath, 'utf8')

test('schema includes query indexes', () => {
  expect(schema.includes('@@index([status, submittedAt])')).toBe(true)
  expect(schema.includes('@@index([status, createdAt])')).toBe(true)
})
