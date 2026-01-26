import { expect, test } from '@playwright/test'

test('filters tickets list on the client without extra requests', async ({ page }) => {
  let ticketRequests = 0

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname === '/api/v1/auth/login') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: { accessToken: 'test-token' },
        }),
      })
    }

    if (url.pathname === '/api/v1/user/detail') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            id: 'user-1',
            username: 'admin',
            roles: [{ code: 'SUPPORT', name: 'Support' }],
            currentRole: { code: 'SUPPORT', name: 'Support' },
          },
        }),
      })
    }

    if (url.pathname === '/api/v1/tickets') {
      ticketRequests += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: { items: [] },
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: {} }),
    })
  })

  await page.goto('/#/login')
  await page.locator('input').first().fill('admin')
  await page.locator('input[type="password"]').fill('Aa123456')
  await page.locator('button').first().click()
  await page.waitForURL('**/tickets')
  await page.waitForResponse(response => response.url().includes('/api/v1/tickets'))

  const initialRequests = ticketRequests
  const keywordInput = page.locator('input:not([readonly])').first()

  await keywordInput.click()
  await keywordInput.type('abc', { delay: 50 })
  await page.waitForTimeout(500)

  expect(ticketRequests - initialRequests).toBe(0)
})
