import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('login 取得 token 後可讀取使用者資訊', async ({ request }) => {
  const token = await login(request)
  const res = await request.get(`${apiBase}/user/detail`, {
    headers: authHeaders(token),
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.data?.username).toBe('admin')
})

test('未授權時 permissions tree 應回 401', async ({ request }) => {
  const res = await request.get(`${apiBase}/role/permissions/tree`)
  expect(res.status()).toBe(401)
})
