import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('roles and audit logs are readable', async ({ request }) => {
  const token = await login(request)

  const rolesRes = await request.get(`${apiBase}/roles`, {
    headers: authHeaders(token),
  })
  expect(rolesRes.ok()).toBeTruthy()
  const rolesBody = await rolesRes.json()
  expect(rolesBody.success).toBe(true)
  expect(Array.isArray(rolesBody.data)).toBeTruthy()

  const auditRes = await request.get(`${apiBase}/audit/logs`, {
    headers: authHeaders(token),
  })
  expect(auditRes.ok()).toBeTruthy()
  const auditBody = await auditRes.json()
  expect(auditBody.success).toBe(true)
  expect(auditBody.data?.page).toBeUndefined()
  expect(auditBody.data?.pageSize).toBeUndefined()
  expect(auditBody.data?.total).toBeUndefined()
})
