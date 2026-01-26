import { expect, test } from '@playwright/test'
import { login } from '../helpers'

test('filters users list on the client without extra requests', async ({ page, request }) => {
  const token = await login(request)
  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  let userRequests = 0

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname === '/api/v1/user/detail') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            id: 'admin-id',
            username: 'admin',
            roles: [{ code: 'ADMIN', name: 'Admin' }],
            currentRole: { code: 'ADMIN', name: 'Admin' },
          },
        }),
      })
    }

    if (url.pathname === '/api/v1/users') {
      userRequests += 1
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 0,
          data: {
            items: [
              {
                id: 'U-1',
                username: 'admin',
                displayName: 'Admin',
                roles: [{ code: 'ADMIN', name: 'Admin' }],
                createdAt: '',
              },
              {
                id: 'U-2',
                username: 'support',
                displayName: 'Support',
                roles: [{ code: 'SUPPORT', name: 'Support' }],
                createdAt: '',
              },
            ],
          },
        }),
      })
    }

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, data: {} }),
    })
  })

  await page.goto('/#/users')
  await page.waitForResponse(response => response.url().includes('/api/v1/users'))

  const initialRequests = userRequests
  const keywordInput = page.locator('input:not([readonly])').first()

  await keywordInput.click()
  await keywordInput.type('adm', { delay: 50 })
  await page.waitForTimeout(500)

  expect(userRequests - initialRequests).toBe(0)
})
