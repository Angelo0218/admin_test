import { createI18n } from 'vue-i18n'
import enUS from './en-US.json'
import zhTW from './zh-TW.json'

export const messages = {
  'zh': zhTW,
  'zh-TW': zhTW,
  'en-US': enUS,
}

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-TW',
  fallbackLocale: 'zh-TW',
  messages,
})
