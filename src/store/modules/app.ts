import { generate, getRgbStr } from '@arco-design/color'
import { useDark } from '@vueuse/core'
import { defineStore } from 'pinia'
import { defaultLayout, defaultPrimaryColor, naiveThemeOverrides } from '@/settings'

export const useAppStore = defineStore('app', {
  state: () => ({
    collapsed: false,
    mobileMenuOpen: false,
    isDark: useDark(),
    layout: defaultLayout,
    primaryColor: defaultPrimaryColor,
    naiveThemeOverrides,
    locale: 'zh-TW',
  }),
  actions: {
    switchCollapsed() {
      this.collapsed = !this.collapsed
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    setCollapsed(b) {
      this.collapsed = b
    },
    setMobileMenuOpen(b) {
      this.mobileMenuOpen = b
    },
    toggleDark() {
      this.isDark = !this.isDark
    },
    setLayout(v) {
      this.layout = v
    },
    setPrimaryColor(color) {
      this.primaryColor = color
    },
    setThemeColor(color = this.primaryColor, isDark = this.isDark) {
      const colors = generate(color, {
        list: true,
        dark: isDark,
      })
      document.body.style.setProperty('--primary-color', getRgbStr(colors[5]))
      this.naiveThemeOverrides.common = Object.assign(this.naiveThemeOverrides.common || {}, {
        primaryColor: colors[5],
        primaryColorHover: colors[4],
        primaryColorSuppl: colors[4],
        primaryColorPressed: colors[6],
      })
    },
    setLocale(locale) {
      this.locale = locale
    },
  },
  persist: {
    pick: ['collapsed', 'layout', 'primaryColor', 'naiveThemeOverrides', 'locale'],
    storage: sessionStorage,
  },
})
