<template>
  <div class="relative wh-full flex-col bg-[url(@/assets/images/login_bg.webp)] bg-cover">
    <div
      class="pointer-events-none absolute inset-0 transition-colors duration-300"
      :class="isDark ? 'bg-black/35' : 'bg-transparent'"
    />
    <div class="absolute right-16 top-16 z-10 flex items-center gap-12">
      <LanguageSelect />
      <ToggleTheme />
    </div>
    <div
      class="relative z-10 m-auto max-w-700 min-w-345 f-c-c rounded-8 auto-bg bg-opacity-20 bg-cover p-12 card-shadow"
    >
      <div class="hidden w-380 px-20 py-35 md:block">
        <img src="@/assets/images/login_banner.webp" class="w-full" alt="login_banner">
      </div>

      <div class="w-320 flex-col px-20 py-32">
        <h2 class="f-c-c text-24 text-#6a6a6a font-normal">
          <img src="@/assets/images/logo.png" class="mr-12 h-50">
          {{ title }}
        </h2>
        <n-input
          v-model:value="loginInfo.username"
          autofocus
          class="mt-32 h-40 items-center"
          :placeholder="t('login.usernamePlaceholder')"
          :maxlength="20"
        >
          <template #prefix>
            <i class="i-fe:user mr-12 opacity-20" />
          </template>
        </n-input>
        <n-input
          v-model:value="loginInfo.password"
          class="mt-20 h-40 items-center"
          type="password"
          show-password-on="mousedown"
          :placeholder="t('login.passwordPlaceholder')"
          :maxlength="20"
          @keydown.enter="handleLogin()"
        >
          <template #prefix>
            <i class="i-fe:lock mr-12 opacity-20" />
          </template>
        </n-input>

        <n-checkbox
          class="mt-20"
          :checked="isRemember"
          :label="t('login.remember')"
          :on-update:checked="(val) => (isRemember = val)"
        />

        <div class="mt-20">
          <n-button
            class="h-40 w-full rounded-5 text-16"
            type="primary"
            :loading="loading"
            @click="handleLogin()"
          >
            {{ t('login.submit') }}
          </n-button>
        </div>
      </div>
    </div>

    <TheFooter class="py-12" />
  </div>
</template>

<script setup>
import { useDark, useStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { ToggleTheme } from '@/components'
import LanguageSelect from '@/layouts/components/LanguageSelect.vue'
import { useAuthStore } from '@/store'
import { lStorage } from '@/utils'
import api from './api'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isDark = useDark()
const title = import.meta.env.VITE_TITLE

const loginInfo = ref({
  username: '',
  password: '',
})

const localLoginInfo = lStorage.get('loginInfo')
if (localLoginInfo) {
  loginInfo.value.username = localLoginInfo.username || ''
}

const isRemember = useStorage('isRemember', true)
const loading = ref(false)
async function handleLogin() {
  const { username, password } = loginInfo.value
  if (!username || !password)
    return $message.warning(t('login.missing'))
  try {
    loading.value = true
    $message.loading(t('login.loading'), { key: 'login' })
    const { data } = await api.login({ username, password: password.toString() })
    if (isRemember.value) {
      lStorage.set('loginInfo', { username })
    }
    else {
      lStorage.remove('loginInfo')
    }
    onLoginSuccess(data)
  }
  catch (error) {
    $message.destroy('login')
    console.error(error)
  }
  loading.value = false
}

async function onLoginSuccess(data = {}) {
  authStore.setToken(data)
  $message.loading(t('login.redirecting'), { key: 'login' })
  try {
    $message.success(t('login.success'), { key: 'login' })
    if (route.query.redirect) {
      const path = route.query.redirect
      delete route.query.redirect
      router.push({ path, query: route.query })
    }
    else {
      router.push('/')
    }
  }
  catch (error) {
    console.error(error)
    $message.destroy('login')
  }
}
</script>
