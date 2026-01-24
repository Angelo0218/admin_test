import { expect, test } from '@playwright/test'

test('axios refreshes token and retries', async ({ page }) => {
  let detailCount = 0

  await page.route('**/api/v1/user/detail', async (route) => {
    detailCount += 1
    if (detailCount === 1) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, data: null, error: { code: 401, message: 'unauthorized' } }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { ok: true }, error: null }),
    })
  })

  await page.route('**/api/v1/auth/refresh/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { accessToken: 'new-token' }, error: null }),
    })
  })

  await page.goto('/#/login')
  await page.waitForSelector('input')

  const result = await page.evaluate(async () => {
    try {
      const { request } = await import('/src/utils/http/index.ts')
      const response = await request.get('/user/detail')
      return { ok: true, response }
    }
    catch (error) {
      return { ok: false, error }
    }
  })

  if (!result.ok) {
    throw new Error(JSON.stringify(result.error))
  }

  expect(result.response?.success).toBe(true)
  expect(result.response?.data?.ok).toBe(true)
  expect(detailCount).toBe(2)
})
