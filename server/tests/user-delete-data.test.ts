import { expect, test } from 'bun:test'
import { buildUserDeleteData } from '../src/models/user'

test('buildUserDeleteData marks user as deleted', () => {
  expect(buildUserDeleteData()).toEqual({
    status: 'DELETED',
    disabledReason: 'deleted',
  })
})
