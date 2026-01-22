<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/16 18:50:42
 - @Email: zclzone@outlook.com
 - Copyright 穢 2023 Ronnie Zhang(憭扯?? | https://isme.top
 --------------------------------->

<template>
  <n-dropdown :options="options" @select="handleSelect">
    <div id="user-dropdown" class="flex cursor-pointer items-center">
      <n-avatar round :size="36" :src="userStore.avatar" />
      <div v-if="userStore.userInfo" class="ml-12 flex-col flex-shrink-0 items-center">
        <span class="text-14">{{ userStore.nickName ?? userStore.username }}</span>
        <span class="text-12 opacity-50">[{{ userStore.currentRole?.name }}]</span>
      </div>
    </div>
  </n-dropdown>

  <RoleSelect ref="roleSelectRef" />
</template>

<script setup>
import api from '@/api'
import { RoleSelect } from '@/layouts/components'
import { useAuthStore, useUserStore } from '@/store'

const userStore = useUserStore()
const authStore = useAuthStore()

const options = reactive([
  {
    label: '切換角色',
    key: 'toggleRole',
    icon: () => h('i', { class: 'i-basil:exchange-solid text-14' }),
    show: computed(() => userStore.roles.length > 1),
  },
  {
    label: '登出',
    key: 'logout',
    icon: () => h('i', { class: 'i-mdi:exit-to-app text-14' }),
  },
])

const roleSelectRef = ref(null)
function handleSelect(key) {
  switch (key) {
    case 'toggleRole':
      roleSelectRef.value?.open({
        onOk() {
          location.reload()
        },
      })
      break
    case 'logout':
      $dialog.confirm({
        title: '確認',
        type: 'info',
        content: '確定要登出嗎？',
        async confirm() {
          try {
            await api.logout()
          }
          catch (error) {
            console.error(error)
          }
          authStore.logout()
          $message.success('已登出')
        },
      })
      break
  }
}
</script>
