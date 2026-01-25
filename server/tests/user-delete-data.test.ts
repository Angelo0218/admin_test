import { expect, test } from 'bun:test'
import { buildUserDeleteData } from '../src/models/user'

test('buildUserDeleteData marks user as deleted', () => {
  const data = buildUserDeleteData()
  expect(data).toEqual({ status: 'DELETED' })
  if (Object.prototype.hasOwnProperty.call(data, 'disabledReason')) {
    throw new Error('disabledReason should be removed from delete data')
  }
})
