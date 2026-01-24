import { expect, test } from '@playwright/test'
import { login } from '../helpers'

test('click Ticket List should not trigger stack overflow', async ({ page, request }) => {
  const token = await login(request)
  await page.addInitScript((value) => {
    localStorage.setItem('vue-naivue-admin_auth', JSON.stringify({ accessToken: value }))
  }, token)

  const errors: string[] = []
  const recordIfRelevant = (message: string) => {
    if (
      message.includes('Maximum call stack size exceeded')
      || message.includes('Unhandled error during execution of native event handler')
    ) {
      errors.push(message)
    }
  }

  page.on('pageerror', error => recordIfRelevant(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      recordIfRelevant(msg.text())
    }
  })

  await page.goto('/#/kyc/pending')
  await page.waitForSelector('.side-menu')

  const menuItems = page.locator('.n-menu-item-content')
  const menuTexts = await menuItems.allTextContents()

  const parentIndex = menuTexts.findIndex(text => /客服工單|Tickets/.test(text))
  expect(parentIndex).toBeGreaterThan(-1)
  await menuItems.nth(parentIndex).click()

  const childItem = page.locator('.n-menu-item-content', { hasText: /工單列表|Ticket List/ })
  await expect(childItem.first()).toBeVisible()
  await childItem.first().click()
  await expect(page).toHaveURL(/#\/tickets/)

  expect(errors).toEqual([])
})
