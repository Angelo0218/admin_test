<template>
  <div class="f-c-c">
    <n-tooltip trigger="hover" placement="bottom">
      <template #trigger>
        <n-color-picker
          id="theme-setting"
          class="h-32 w-32"
          :value="appStore.primaryColor"
          :swatches="primaryColors"
          :on-update:value="(v) => appStore.setPrimaryColor(v)"
          :render-label="() => ''"
        />
      </template>
      {{ t('theme.primaryColor') }}
    </n-tooltip>
  </div>
</template>

<script setup>
import { getPresetColors } from '@arco-design/color'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store'

const { t } = useI18n()
const appStore = useAppStore()

const primaryColors = Object.entries(getPresetColors()).map(([, value]) => value.primary)
</script>
