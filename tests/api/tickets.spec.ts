import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('工單列表與詳情可讀取', async ({ request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
    params: { page: 1, pageSize: 10 },
  })
  expect(listRes.ok()).toBeTruthy()
  const listBody = await listRes.json()
  expect(listBody.code).toBe(0)
  const first = listBody.data?.items?.[0]
  expect(first?.id).toBeTruthy()

  const detailRes = await request.get(`${apiBase}/tickets/${first.id}`, {
    headers: authHeaders(token),
  })
  expect(detailRes.ok()).toBeTruthy()
  const detailBody = await detailRes.json()
  expect(detailBody.code).toBe(0)
})

test('工單狀態不合法轉移應回 400', async ({ request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
    params: { page: 1, pageSize: 10 },
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
