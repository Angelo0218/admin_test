import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, ensureKycApplication, login } from '../helpers'

test('KYC 列表與詳情可讀取', async ({ request }) => {
  const token = await login(request)
  const first = await ensureKycApplication(request, token)

  const detailRes = await request.get(`${apiBase}/kyc/applications/${first.id}`, {
    headers: authHeaders(token),
  })
  expect(detailRes.ok()).toBeTruthy()
  const detailBody = await detailRes.json()
  expect(detailBody.success).toBe(true)
})

test('KYC 狀態轉移不合法應回 400', async ({ request }) => {
  const token = await login(request)
  const passedRes = await request.get(`${apiBase}/kyc/applications`, {
    headers: authHeaders(token),
    params: { status: 'PASSED', page: 1, pageSize: 1 },
  })
  expect(passedRes.ok()).toBeTruthy()
  const passedBody = await passedRes.json()
  const targetId = passedBody.data?.items?.[0]?.id
  expect(targetId).toBeTruthy()

  const reviewRes = await request.post(`${apiBase}/kyc/applications/${targetId}/review`, {
    headers: authHeaders(token),
    data: { action: 'REJECTED', comment: 'invalid transition test' },
  })
  expect(reviewRes.status()).toBe(400)
})

test('KYC 申訴列表可讀取', async ({ request }) => {
  const token = await login(request)
  const res = await request.get(`${apiBase}/kyc/appeals`, {
    headers: authHeaders(token),
    params: { page: 1, pageSize: 10 },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
})
