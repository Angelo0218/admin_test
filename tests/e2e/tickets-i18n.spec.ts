import { expect, test } from '@playwright/test'
import { login } from '../helpers'

test('tickets list should not emit i18n missing key warnings', async ({ page, request }) => {
  const token = await login(request)
  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  const warnings: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'warning' || msg.type() === 'warn') {
      warnings.push(msg.text())
    }
  })

  await page.route('**/tickets**', async (route) => {
    const req = route.request()
    if (req.method() === 'GET') {
      const url = new URL(req.url())
      if (url.pathname.endsWith('/tickets')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 0,
            data: {
              items: [
                {
                  id: 'T-1',
                  subject: 'Test subject',
                  status: '',
                  category: '',
                  requesterName: 'Tester',
                  createdAt: '',
                },
              ],
            },
          }),
        })
        return
      }
    }
    await route.continue()
  })

  await page.goto('/#/tickets')
  await expect(page.getByRole('table').getByText('Test subject')).toBeVisible()

  const missingKeyWarnings = warnings.filter(text => text.includes('[intlify] Not found'))
  expect(missingKeyWarnings).toEqual([])
})
