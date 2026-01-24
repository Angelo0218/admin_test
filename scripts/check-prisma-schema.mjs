import { readFile } from 'node:fs/promises'
import path from 'node:path'

const schemaPath = path.join(process.cwd(), 'server/prisma/schema.prisma')
const schema = await readFile(schemaPath, 'utf8')

const hasHandledByNamedRelation = /handledBy\s+User\?\s+@relation\("AppealHandler",\s*fields:\s*\[handledById\],\s*references:\s*\[id\]\)/.test(schema)
const hasUserHandledAppeals = /handledAppeals\s+KycAppeal\[\]\s+@relation\("AppealHandler"\)/.test(schema)

if (!hasHandledByNamedRelation || !hasUserHandledAppeals) {
  console.error('Prisma schema missing KycAppeal handledBy opposite relation.')
  process.exit(1)
}

console.log('ok')
