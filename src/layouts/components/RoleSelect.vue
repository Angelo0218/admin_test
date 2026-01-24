<template>
  <MeModal ref="modalRef" :title="t('common.toggleRole')" width="360px" class="p-12">
    <n-radio-group v-model:value="roleCode" class="cus-scroll-y max-h-420 w-full py-16">
      <n-space vertical :size="24" class="mx-12">
        <n-radio-button
          v-for="role in roles"
          :key="role.id"
          class="h-36 w-full text-center text-16 leading-36"
          :class="{ 'bg-primary! color-white!': role.code === roleCode }"
          :value="role.code"
        >
          {{ resolveRoleName(role) }}
        </n-radio-button>
      </n-space>
    </n-radio-group>

    <template #footer>
      <div class="flex">
        <n-button class="flex-1" size="large" @click="logout()">
          {{ t('common.logout') }}
        </n-button>
        <n-button
          :loading="okLoading"
          class="ml-20 flex-1"
          type="primary"
          size="large"
          :disabled="userStore.currentRole?.code === roleCode"
          @click="setCurrentRole"
        >
          {{ t('common.confirm') }}
        </n-button>
      </div>
    </template>
  </MeModal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import api from '@/api'
import { MeModal } from '@/components'
import { useModal } from '@/composables'
import { useAuthStore, useUserStore } from '@/store'

const userStore = useUserStore()
const authStore = useAuthStore()
const { t } = useI18n()

const roles = ref(userStore.roles || [])
const roleCode = ref(userStore.currentRole?.code ?? roles.value[0]?.code ?? '')

const [modalRef, okLoading] = useModal()
function open(options) {
  modalRef.value?.open({
    ...options,
  })
}

function resolveRoleName(role) {
  const key = `roles.${role.code}`
  const label = t(key)
  return label === key ? role.name : label
}

async function setCurrentRole() {
  try {
    okLoading.value = true
    const { data } = await api.switchCurrentRole(roleCode.value)
    await authStore.switchCurrentRole(data)
    okLoading.value = false
    $message.success(t('common.switchRoleSuccess'))
    modalRef.value?.handleOk()
  }
  catch (error) {
    console.error(error)
    okLoading.value = false
    return false
  }
}

async function logout() {
  await api.logout()
  authStore.logout()
  modalRef.value?.close()
  $message.success(t('common.logoutSuccess'))
}

defineExpose({
  open,
})
</script>
