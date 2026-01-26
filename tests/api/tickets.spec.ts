import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('tickets list and detail are readable', async ({ request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
  })
  expect(listRes.ok()).toBeTruthy()
  const listBody = await listRes.json()
  expect(listBody.success).toBe(true)
  expect(listBody.data?.page).toBeUndefined()
  expect(listBody.data?.pageSize).toBeUndefined()
  expect(listBody.data?.total).toBeUndefined()
  const first = listBody.data?.items?.[0]
  expect(first?.id).toBeTruthy()

  const detailRes = await request.get(`${apiBase}/tickets/${first.id}`, {
    headers: authHeaders(token),
  })
  expect(detailRes.ok()).toBeTruthy()
  const detailBody = await detailRes.json()
  expect(detailBody.success).toBe(true)
})

test('ticket invalid status transition returns 400', async ({ request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
  })
  expect(listRes.ok()).toBeTruthy()
  const listBody = await listRes.json()
  const first = listBody.data?.items?.[0]
  expect(first?.id).toBeTruthy()

  const invalidStatus = first.status
  const statusRes = await request.post(`${apiBase}/tickets/${first.id}/status`, {
    headers: authHeaders(token),
    data: { status: invalidStatus },
  })
  expect(statusRes.status()).toBe(400)
})

test('ticket concurrent status updates allow only one success', async ({ request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
  })
  expect(listRes.ok()).toBeTruthy()
  const listBody = await listRes.json()
  const transitions = {
    WAITING: 'IN_PROGRESS',
    IN_PROGRESS: 'CLOSED',
  }
  const candidate = listBody.data?.items?.find(item => transitions[item.status])
  expect(candidate?.id).toBeTruthy()
  const nextStatus = transitions[candidate.status]

  const responses = await Promise.all(
    Array.from({ length: 6 }, () =>
      request.post(`${apiBase}/tickets/${candidate.id}/status`, {
        headers: authHeaders(token),
        data: { status: nextStatus },
      })),
  )

  const statusCodes = responses.map(res => res.status())
  const successCount = statusCodes.filter(code => code === 200).length
  const invalidCount = statusCodes.filter(code => code === 400).length
  expect(successCount).toBe(1)
  expect(invalidCount).toBe(5)
})
