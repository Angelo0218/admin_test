import { readFile } from 'node:fs/promises'
import path from 'node:path'

const files = [
  'src/views/users/index.vue',
  'src/views/tickets/index.vue',
  'src/views/kyc/pending/index.vue',
  'src/views/kyc/appeals/index.vue',
  'src/views/audit/index.vue',
]

for (const file of files) {
  const content = await readFile(path.join(process.cwd(), file), 'utf8')
  if (!content.includes('useListPage(')) {
    console.error(`${file} does not use useListPage.`)
    process.exit(1)
  }
}

console.log('ok')
