<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/16 18:52:48
 - @Email: zclzone@outlook.com
 - Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 --------------------------------->

<template>
  <AppCard class="flex items-center justify-between px-12" border-b="1px solid light_border dark:dark_border">
    <MenuCollapse />

    <div class="flex flex-shrink-0 items-center px-12 text-18">
      <ToggleTheme />
      <UserAvatar />
    </div>
  </AppCard>
</template>

<script setup>
import { ToggleTheme } from '@/components'
import { MenuCollapse, UserAvatar } from '@/layouts/components'
</script>
