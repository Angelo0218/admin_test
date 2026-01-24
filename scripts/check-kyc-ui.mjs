import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const permissionPath = path.join(root, 'src/router/permission-tree.js')
const pendingPath = path.join(root, 'src/views/kyc/pending/index.vue')

const [permissionContent, pendingContent] = await Promise.all([
  readFile(permissionPath, 'utf8'),
  readFile(pendingPath, 'utf8'),
])

const menuCodes = ['KycPending', 'KycAppeals', 'TicketList']
const missingIcons = menuCodes.filter((code) => {
  const hasIcon = (content) => {
    const lines = content.split(/\r?\n/)
    const codeIndex = lines.findIndex(line => line.includes(`code: '${code}'`))
    if (codeIndex === -1)
      return false
    for (let i = codeIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes('code:'))
        break
      if (line.includes('icon:'))
        return true
    }
    return false
  }
  return !hasIcon(permissionContent)
})

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
