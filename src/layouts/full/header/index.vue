<template>
  <AppCard class="flex items-center justify-between px-12" border-b="1px solid light_border dark:dark_border">
    <div class="flex items-center gap-12">
      <MenuCollapse />
      <BreadCrumb />
    </div>

    <div class="flex flex-shrink-0 items-center gap-12 px-12 text-18">
      <ToggleTheme />
      <LanguageSelect />
      <UserAvatar />
    </div>
  </AppCard>
</template>

<script setup>
import { ToggleTheme } from '@/components'
import { BreadCrumb, LanguageSelect, MenuCollapse, UserAvatar } from '@/layouts/components'
</script>
