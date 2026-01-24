import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('角色與審計列表可讀取', async ({ request }) => {
  const token = await login(request)

  const rolesRes = await request.get(`${apiBase}/roles`, {
    headers: authHeaders(token),
  })
  expect(rolesRes.ok()).toBeTruthy()
  const rolesBody = await rolesRes.json()
  expect(rolesBody.code).toBe(0)
  expect(Array.isArray(rolesBody.data)).toBeTruthy()

  const auditRes = await request.get(`${apiBase}/audit/logs`, {
    headers: authHeaders(token),
    params: { page: 1, pageSize: 10 },
  })
  expect(auditRes.ok()).toBeTruthy()
  const auditBody = await auditRes.json()
  expect(auditBody.code).toBe(0)
})
