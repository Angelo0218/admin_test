import { expect, test } from '@playwright/test'
import { ensureKycApplication, login } from '../helpers'

test('管理員登入後可瀏覽主要頁面', async ({ page, request }) => {
  const token = await login(request)
  await ensureKycApplication(request, token)
  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  await page.goto('/#/kyc/pending')

  await expect(page.getByText('KYC 審核', { exact: true })).toBeVisible()
  await expect(page.locator('#top-tab')).toBeVisible()
  await expect(page.locator('text=????')).toHaveCount(0)

  await page.getByRole('button', { name: '查看' }).first().click()
  await expect(page.locator('#top-tab')).toBeVisible()
  await expect(page.locator('#top-tab').getByText('審核詳情')).toHaveCount(0)
})
