import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('users list is readable', async ({ request }) => {
  const token = await login(request)
  const res = await request.get(`${apiBase}/users`, {
    headers: authHeaders(token),
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.success).toBe(true)
  expect(body.data?.page).toBeUndefined()
  expect(body.data?.pageSize).toBeUndefined()
  expect(body.data?.total).toBeUndefined()
  expect(Array.isArray(body.data?.items)).toBeTruthy()
})
