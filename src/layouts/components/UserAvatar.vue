<template>
  <n-dropdown :options="options" @select="handleSelect">
    <div id="user-dropdown" class="flex cursor-pointer items-center">
      <n-avatar round :size="36" :src="userStore.avatar" />
      <div v-if="userStore.userInfo" class="ml-12 flex-col flex-shrink-0 items-center">
        <span class="text-14">{{ userStore.nickName ?? userStore.username }}</span>
        <span class="text-12 opacity-50">[{{ roleLabel }}]</span>
      </div>
    </div>
  </n-dropdown>

  <RoleSelect ref="roleSelectRef" />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import api from '@/api'
import { RoleSelect } from '@/layouts/components'
import { useAuthStore, useUserStore } from '@/store'

const userStore = useUserStore()
const authStore = useAuthStore()
const { t } = useI18n()

const roleLabel = computed(() => {
  const code = userStore.currentRole?.code
  if (!code)
    return ''
  const key = `roles.${code}`
  const label = t(key)
  return label === key ? userStore.currentRole?.name : label
})

const options = computed(() => [
  {
    label: t('common.toggleRole'),
    key: 'toggleRole',
    icon: () => h('i', { class: 'i-basil:exchange-solid text-14' }),
    show: userStore.roles.length > 1,
  },
  {
    label: t('common.logout'),
    key: 'logout',
    icon: () => h('i', { class: 'i-mdi:exit-to-app text-14' }),
  },
])

/** @type {import('vue').Ref<{ open: (options: Record<string, any>) => void } | null>} */
const roleSelectRef = ref(null)
/**
 * @param {string} key
 */
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
        title: t('common.confirm'),
        type: 'info',
        content: t('common.confirmLogout'),
        async confirm() {
          try {
            await api.logout()
          }
          catch (error) {
            console.error(error)
          }
          authStore.logout()
          $message.success(t('common.logoutSuccess'))
        },
      })
      break
  }
}
</script>
