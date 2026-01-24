import { expect, test } from '@playwright/test'

test('remember me stores only username', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'ok',
        data: { accessToken: 'test-token' },
      }),
    })
  })

  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'ok', data: {} }),
    })
  })

  await page.goto('/#/login')

  const inputs = page.locator('input')
  await inputs.nth(0).fill('admin')
  await inputs.nth(1).fill('123456')
  await inputs.nth(1).press('Enter')

  await page.waitForFunction(() => {
    const raw = localStorage.getItem('vue-naive-admin_logininfo')
    if (!raw)
      return false
    const parsed = JSON.parse(raw)
    return parsed?.value?.username === 'admin'
  })

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('vue-naive-admin_logininfo')
    return raw ? JSON.parse(raw) : null
  })

  expect(stored?.value?.username).toBe('admin')
  expect(stored?.value?.password).toBeUndefined()
})
