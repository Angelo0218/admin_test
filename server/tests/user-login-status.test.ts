import { expect, test } from 'bun:test'
import { canLoginWithStatus } from '../src/models/user'

test('login is blocked only when status is deleted', () => {
  expect(canLoginWithStatus('DELETED')).toBe(false)
  expect(canLoginWithStatus('ACTIVE')).toBe(true)
  expect(canLoginWithStatus('SUSPENDED')).toBe(true)
})
