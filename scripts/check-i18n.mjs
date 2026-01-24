import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function getNested(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

const localesIndexPath = path.resolve(__dirname, '../src/locales/index.js')
const localesIndexSource = fs.readFileSync(localesIndexPath, 'utf8')
assert(/['"]zh['"]\s*:/.test(localesIndexSource), 'missing locale alias: messages["zh"]')

const zhTwPath = path.resolve(__dirname, '../src/locales/zh-TW.json')
const zhTwSource = fs.readFileSync(zhTwPath, 'utf8')
const zhTwMessages = JSON.parse(zhTwSource)

const requiredKeys = ['tickets.status.WAITING', 'tickets.category.ACCOUNT']
for (const key of requiredKeys) {
  assert(getNested(zhTwMessages, key), `missing zh-TW key: ${key}`)
}

const detailPath = path.resolve(__dirname, '../src/views/tickets/detail/index.vue')
const detailSource = fs.readFileSync(detailPath, 'utf8')

assert(/function statusLabel\(status\)[\s\S]*?if \(!status\)/.test(detailSource), 'statusLabel missing empty guard')
assert(/function categoryLabel\(category\)[\s\S]*?if \(!category\)/.test(detailSource), 'categoryLabel missing empty guard')

console.log('i18n checks passed')
