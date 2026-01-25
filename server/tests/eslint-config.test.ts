import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'bun:test'

const here = path.dirname(fileURLToPath(import.meta.url))
const eslintPath = path.resolve(here, '..', '..', 'eslint.config.js')

test('eslint config enables typescript parsing', () => {
  const configText = readFileSync(eslintPath, 'utf8')
  expect(configText).toContain('typescript: true')
})
