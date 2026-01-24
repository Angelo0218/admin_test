<template>
  <div />
</template>

<script setup>
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const defaultRoute = computed(() => {
  const role = userStore.currentRole?.code || userStore.roles?.[0]?.code
  if (role === 'SUPPORT')
    return '/tickets'
  return '/kyc/pending'
})

watchEffect(() => {
  if (defaultRoute.value)
    router.replace(defaultRoute.value)
})
</script>
