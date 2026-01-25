import { readFile } from 'node:fs/promises'
import path from 'node:path'

const routesPath = path.join(process.cwd(), 'src/router/basic-routes.ts')
const content = await readFile(routesPath, 'utf8')

if (/meta:\s*\{[^}]*title\s*:/.test(content)) {
  console.error('meta.title should be removed; use titleKey only.')
  process.exit(1)
}

console.log('ok')
