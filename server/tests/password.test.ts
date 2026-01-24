import { expect, test } from 'bun:test'
import { hashPassword, verifyPassword } from '../src/utils/password'

test('hash and verify password', async () => {
  const plain = 'P@ssw0rd!'
  const hash = await hashPassword(plain)
  expect(hash).not.toBe(plain)
  expect(await verifyPassword(plain, hash)).toBe(true)
})
