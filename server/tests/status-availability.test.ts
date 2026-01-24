import { expect, test } from 'bun:test'
import { getKycAvailableActions, getKycAvailableStatuses } from '../src/models/kyc'
import { getTicketAvailableActions, getTicketAvailableStatuses } from '../src/models/ticket'

test('kyc available actions follow transition map', () => {
  expect(getKycAvailableActions('PENDING')).toEqual(['NEED_MORE', 'PASSED', 'REJECTED'])
  expect(getKycAvailableStatuses('NEED_MORE')).toEqual(['PASSED', 'REJECTED'])
  expect(getKycAvailableActions('PASSED')).toEqual([])
})

test('ticket available statuses follow transition map', () => {
  expect(getTicketAvailableStatuses('WAITING')).toEqual(['IN_PROGRESS'])
  expect(getTicketAvailableActions('IN_PROGRESS')).toEqual(['CLOSED'])
  expect(getTicketAvailableStatuses('CLOSED')).toEqual([])
})
