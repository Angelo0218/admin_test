<template>
  <n-dropdown :options="options" @select="handleSelect">
    <div id="language-dropdown" class="flex cursor-pointer items-center">
      <i class="i-mdi:translate text-18" />
    </div>
  </n-dropdown>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store'

const appStore = useAppStore()
const { t } = useI18n()

const options = computed(() => [
  { label: t('common.languageZh'), key: 'zh-TW' },
  { label: t('common.languageEn'), key: 'en-US' },
])

/**
 * @param {string} key
 */
function handleSelect(key) {
  if (!key)
    return
  appStore.setLocale(key)
}
</script>
