import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('用戶列表可讀取', async ({ request }) => {
  const token = await login(request)
  const res = await request.get(`${apiBase}/users`, {
    headers: authHeaders(token),
    params: { page: 1, pageSize: 10 },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.code).toBe(0)
  expect(Array.isArray(body.data?.items)).toBeTruthy()
})
