import { expect, test } from 'bun:test'
import { isOriginAllowed, resolveCorsOrigin } from '../src/utils/cors'

test('cors rejects unknown origin', () => {
  const allowed = 'https://allowed.example,https://second.example'
  expect(isOriginAllowed('https://evil.example', allowed)).toBe(false)
  expect(isOriginAllowed('https://allowed.example', allowed)).toBe(true)
  expect(resolveCorsOrigin('https://evil.example', allowed)).toBeUndefined()
  expect(resolveCorsOrigin('https://allowed.example', allowed)).toBe('https://allowed.example')
})
