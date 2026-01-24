<template>
  <n-config-provider
    class="wh-full"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    :theme="appStore.isDark ? darkTheme : undefined"
    :theme-overrides="appStore.naiveThemeOverrides"
  >
    <router-view v-if="Layout" v-slot="{ Component, route: curRoute }">
      <component :is="Layout">
        <transition name="fade-slide" mode="out-in" appear>
          <KeepAlive :include="keepAliveNames">
            <component :is="Component" v-if="!tabStore.reloading" :key="curRoute.fullPath" />
          </KeepAlive>
        </transition>
      </component>

      <LayoutSetting v-if="layoutSettingVisible" class="fixed right-12 top-1/2 z-999" />
    </router-view>
  </n-config-provider>
</template>

<script setup>
import dayjs from 'dayjs'
import { darkTheme, dateEnUS, dateZhTW, enUS, zhTW } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { LayoutSetting } from '@/components'
import { useAppStore, usePermissionStore, useTabStore } from '@/store'
import { layoutSettingVisible } from './settings'

const { locale } = useI18n()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const tabStore = useTabStore()

const layouts = new Map()
function getLayout(name) {
  if (layouts.get(name))
    return layouts.get(name)
  const layout = markRaw(defineAsyncComponent(() => import(`@/layouts/${name}/index.vue`)))
  layouts.set(name, layout)
  return layout
}

const route = useRoute()
if (appStore.layout === 'default')
  appStore.setLayout('')
const Layout = computed(() => {
  if (!route.matched?.length)
    return null
  return getLayout(route.meta?.layout || appStore.layout)
})

const naiveLocale = computed(() => (locale.value === 'en-US' ? enUS : zhTW))
const naiveDateLocale = computed(() => (locale.value === 'en-US' ? dateEnUS : dateZhTW))

const keepAliveNames = computed(() => {
  return tabStore.tabs.filter(item => item.keepAlive).map(item => item.name)
})

watchEffect(() => {
  appStore.setThemeColor(appStore.primaryColor, appStore.isDark)
  locale.value = appStore.locale
  dayjs.locale(locale.value === 'en-US' ? 'en' : 'zh-tw')
  if (permissionStore.permissions.length) {
    permissionStore.rebuildMenus()
  }
})
</script>
