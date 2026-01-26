import { expect, test } from '@playwright/test'
import { apiBase, authHeaders, login } from '../helpers'

test('kyc detail updates when route param changes', async ({ page, request }) => {
  const token = await login(request)
  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  await page.goto('/#/kyc/detail/KYC_1001')
  await expect(page.getByText('KYC_1001', { exact: true })).toBeVisible()

  await page.evaluate(() => {
    window.location.hash = '#/kyc/detail/KYC_1002'
  })
  await expect(page.getByText('KYC_1002', { exact: true })).toBeVisible()
})

test('ticket detail updates when route param changes', async ({ page, request }) => {
  const token = await login(request)
  const listRes = await request.get(`${apiBase}/tickets`, {
    headers: authHeaders(token),
  })
  expect(listRes.ok()).toBeTruthy()
  const listBody = await listRes.json()
  const items = listBody.data?.items || []
  const first = items[0]
  const second = items[1]
  expect(first?.id).toBeTruthy()
  expect(second?.id).toBeTruthy()

  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  await page.goto(`/#/tickets/${first.id}`)
  await expect(page.getByText(first.id, { exact: true })).toBeVisible()

  await page.evaluate((id) => {
    window.location.hash = `#/tickets/${id}`
  }, second.id)
  await expect(page.getByText(second.id, { exact: true })).toBeVisible()
})
