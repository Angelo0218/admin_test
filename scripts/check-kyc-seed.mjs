import { readFile } from 'node:fs/promises'
import path from 'node:path'

const seedPath = path.join(process.cwd(), 'server/src/models/seed.ts')
const content = await readFile(seedPath, 'utf8')

if (content.includes('https://cdn.example.com/kyc/')) {
  console.error('Seed still uses cdn.example.com for KYC images.')
  process.exit(1)
}

console.log('ok')
