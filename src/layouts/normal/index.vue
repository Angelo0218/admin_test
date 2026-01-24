<template>
  <div class="wh-full flex">
    <div
      v-if="isMobile && appStore.mobileMenuOpen"
      class="fixed inset-0 z-20 bg-black/40"
      @click="appStore.setMobileMenuOpen(false)"
    />
    <aside
      class="flex-col flex-shrink-0 transition-all-300"
      :class="asideClass"
      border-r="1px solid light_border dark:dark_border"
    >
      <SideBar />
    </aside>

    <article class="min-w-0 flex-col flex-1" :class="articleClass">
      <AppHeader class="h-60 flex-shrink-0" />
      <AppTab v-if="!isMobile" class="flex-shrink-0" />
      <slot />
    </article>
  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { AppTab } from '@/layouts/components'
import { useAppStore } from '@/store'
import AppHeader from './header/index.vue'
import SideBar from './sidebar/index.vue'

const appStore = useAppStore()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 900)

const asideClass = computed(() => {
  if (isMobile.value) {
    return appStore.mobileMenuOpen
      ? 'fixed inset-y-0 left-0 z-30 w-220 translate-x-0'
      : 'fixed inset-y-0 left-0 z-30 w-220 -translate-x-full'
  }
  return appStore.collapsed ? 'w-64' : 'w-220'
})

const articleClass = computed(() => (isMobile.value ? 'w-full' : 'w-0'))
</script>

<style>
.collapsed {
  width: 64px;
}
</style>
