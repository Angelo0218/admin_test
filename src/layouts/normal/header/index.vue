<template>
  <AppCard class="flex items-center justify-between px-12" border-b="1px solid light_border dark:dark_border">
    <MenuCollapse />

    <div class="flex flex-shrink-0 items-center gap-12 px-12 text-18">
      <ToggleTheme />
      <LanguageSelect />
      <UserAvatar />
    </div>
  </AppCard>
</template>

<script setup>
import { ToggleTheme } from '@/components'
import { LanguageSelect, MenuCollapse, UserAvatar } from '@/layouts/components'
</script>
