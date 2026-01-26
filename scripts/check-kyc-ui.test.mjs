import { spawnSync } from 'node:child_process'

const result = spawnSync('node', ['scripts/check-kyc-ui.mjs'], {
  encoding: 'utf8',
})

if (result.status !== 0) {
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n')
  console.error(output || 'check-kyc-ui failed')
  process.exit(1)
}

console.log('check-kyc-ui ok')
