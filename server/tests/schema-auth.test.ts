import { expect, test } from 'bun:test'
import { loginSchema } from '../src/schemas/auth'

test('login rejects weak username/password', () => {
  expect(loginSchema.safeParse({ username: 'ab', password: '12345678' }).success).toBe(false)
  expect(loginSchema.safeParse({ username: 'bad name', password: '12345678' }).success).toBe(false)
  expect(loginSchema.safeParse({ username: 'valid_user', password: 'short' }).success).toBe(false)
})
