import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const routesPath = path.join(root, 'src/router/basic-routes.ts')
const routeGroupsPath = path.join(root, 'src/router/route-groups.ts')
const pendingPath = path.join(root, 'src/views/kyc/pending/index.vue')

const [routesContent, groupsContent, pendingContent] = await Promise.all([
  readFile(routesPath, 'utf8'),
  readFile(routeGroupsPath, 'utf8'),
  readFile(pendingPath, 'utf8'),
])

const missingIcons = []
function hasRouteIcon(content, name) {
  const lines = content.split(/\r?\n/)
  const nameIndex = lines.findIndex(line => line.includes(`name: '${name}'`))
  if (nameIndex === -1)
    return false
  for (let i = nameIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('name:'))
      break
    if (line.includes('icon:'))
      return true
  }
  return false
}

if (!hasRouteIcon(routesContent, 'Kyc'))
  missingIcons.push('Kyc')

const hasTicketsGroupIcon = /group:\s*\{[\s\S]*?code:\s*'Tickets'[\s\S]*?icon:/.test(routesContent)
  || /Tickets:\s*\{[\s\S]*?code:\s*'Tickets'[\s\S]*?icon:/.test(groupsContent)
if (!hasTicketsGroupIcon)
  missingIcons.push('Tickets')

const mockUrls = [
  'https://picsum.photos/160/120?random=1',
  'https://picsum.photos/160/120?random=2',
]
const missingMocks = mockUrls.filter(url => !pendingContent.includes(url))

if (missingIcons.length || missingMocks.length) {
  if (missingIcons.length)
    console.error(`Missing menu icons for: ${missingIcons.join(', ')}`)
  if (missingMocks.length)
    console.error(`Missing mock image urls: ${missingMocks.join(', ')}`)
  process.exit(1)
}

console.log('ok')
