import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, ensureKycApplication, login } from '../helpers'

test('KYC list and detail are readable', async ({ request }) => {
  const token = await login(request)
  const first = await ensureKycApplication(request, token)

  const detailRes = await request.get(`${apiBase}/kyc/applications/${first.id}`, {
    headers: authHeaders(token),
  })
  expect(detailRes.ok()).toBeTruthy()
  const detailBody = await detailRes.json()
  expect(detailBody.success).toBe(true)
})

test('KYC invalid status transition returns 400', async ({ request }) => {
  const token = await login(request)
  const passedRes = await request.get(`${apiBase}/kyc/applications`, {
    headers: authHeaders(token),
  })
  expect(passedRes.ok()).toBeTruthy()
  const passedBody = await passedRes.json()
  expect(passedBody.data?.page).toBeUndefined()
  expect(passedBody.data?.pageSize).toBeUndefined()
  expect(passedBody.data?.total).toBeUndefined()
  const target = passedBody.data?.items?.find(item => item.status === 'PASSED')
  const targetId = target?.id
  expect(targetId).toBeTruthy()

  const reviewRes = await request.post(`${apiBase}/kyc/applications/${targetId}/review`, {
    headers: authHeaders(token),
    data: { action: 'REJECTED', comment: 'invalid transition test' },
  })
  expect(reviewRes.status()).toBe(400)
})

test('KYC appeals list is readable', async ({ request }) => {
  const token = await login(request)
  const res = await request.get(`${apiBase}/kyc/appeals`, {
    headers: authHeaders(token),
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.data?.page).toBeUndefined()
  expect(body.data?.pageSize).toBeUndefined()
  expect(body.data?.total).toBeUndefined()
})

test('KYC concurrent reviews allow only one success', async ({ request }) => {
  const token = await login(request)
  const target = await ensureKycApplication(request, token, 'PENDING')
  const payload = { action: 'PASSED', comment: 'race' }

  const responses = await Promise.all(
    Array.from({ length: 6 }, () =>
      request.post(`${apiBase}/kyc/applications/${target.id}/review`, {
        headers: authHeaders(token),
        data: payload,
      })),
  )

  const statusCodes = responses.map(res => res.status())
  const successCount = statusCodes.filter(code => code === 200).length
  const invalidCount = statusCodes.filter(code => code === 400).length
  expect(successCount).toBe(1)
  expect(invalidCount).toBe(5)
})
