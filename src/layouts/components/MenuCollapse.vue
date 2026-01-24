<template>
  <div
    id="menu-collapse"
    class="f-c-c cursor-pointer rounded-4 auto-bg-hover p-6 text-22 transition-all-300"
    @click="handleToggle"
  >
    <i :class="menuIcon" />
  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 900)

const menuIcon = computed(() => {
  if (isMobile.value) {
    return appStore.mobileMenuOpen ? 'i-fe:x' : 'i-fe:menu'
  }
  return appStore.collapsed ? 'i-fe:chevrons-right' : 'i-fe:chevrons-left'
})

function handleToggle() {
  if (isMobile.value) {
    appStore.toggleMobileMenu()
    return
  }
  appStore.switchCollapsed()
}
</script>
